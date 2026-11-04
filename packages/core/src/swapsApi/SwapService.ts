import {
    Configuration,
    CrosschainApi,
    CrossSwapAggregator,
    ResponseError,
    SwapApi
} from '../swapsApiGenerated';
import type {
    CreateCrossSwapQuoteRequest,
    CrossSwapApprovalMode,
    CrossSwapAsset as CrossSwapAssetApi,
    CrossSwapPrepare,
    CrossSwapProviderError,
    CrossSwapProviderErrorCode,
    CrossSwapQuote,
    CrossSwapRoute,
    OmnistonSwapMessages,
    SwapAsset
} from '../swapsApiGenerated';
import { joinUrl, removeLastSlash } from '../utils/url';
import { decodeCrossSwapJson, extraQueryMiddleware, swapsApiConfiguration } from './client';

export { decodeCrossSwapJson, encodeCrossSwapJson } from './client';

const crosschainApi = (baseUrl: string, query: Record<string, string> = {}): CrosschainApi =>
    new CrosschainApi(swapsApiConfiguration(baseUrl, query));

/**
 * A swap asset as consumers see it. The wire model carries no chain field:
 * `asset_id` is canonical and starts with `{chain}/{network}`, so `chainId`
 * is derived once here instead of re-split at every use.
 */
export type CrossSwapAsset = CrossSwapAssetApi & { chainId: string };

export const normalizeCrossSwapAsset = (asset: CrossSwapAssetApi): CrossSwapAsset => ({
    ...asset,
    chainId: asset.assetId.split('/').slice(0, 2).join('/')
});

export async function fetchCrossSwapAssets(
    baseUrl: string,
    params: { q?: string; limit?: number; chain?: string } = {},
    query: Record<string, string> = {}
): Promise<CrossSwapAsset[]> {
    const response = await crosschainApi(baseUrl, query).listCrossSwapAssets(params);
    return response.assets.map(normalizeCrossSwapAsset);
}

/**
 * One catalog asset by its swaps-backend id, for assets the capped list
 * request leaves out. Resolves to `undefined` when the catalog doesn't know
 * the asset — not an error, the caller falls back to its defaults.
 */
export async function fetchCrossSwapAsset(
    baseUrl: string,
    assetId: string,
    query: Record<string, string> = {}
): Promise<CrossSwapAsset | undefined> {
    try {
        const asset = await crosschainApi(baseUrl, query).getCrossSwapAsset({ assetId });
        return normalizeCrossSwapAsset(asset);
    } catch (e) {
        if (e instanceof ResponseError && e.response.status === 404) return undefined;
        throw e;
    }
}

export interface CrossSwapDefaultPair {
    sourceAsset: CrossSwapAsset;
    destinationAsset: CrossSwapAsset;
}

/** Slippage presets for one source chain, in basis points. */
export interface CrossSwapSlippageOptions {
    optionsBps: number[];
    defaultBps: number;
}

export interface CrossSwapConfig {
    defaultPair: CrossSwapDefaultPair;
    /**
     * Keyed by the source asset's chain code — the first segment of its
     * asset id (`ton`, `eth`, `bsc`, …). Chains the backend leaves out fall
     * back to the client's own presets.
     */
    slippages: Record<string, CrossSwapSlippageOptions>;
}

const isBpsList = (value: unknown): value is number[] =>
    Array.isArray(value) && value.length > 0 && value.every(v => Number.isInteger(v) && v >= 0);

function normalizeSlippages(raw: unknown): Record<string, CrossSwapSlippageOptions> {
    if (typeof raw !== 'object' || raw === null) return {};
    const result: Record<string, CrossSwapSlippageOptions> = {};
    for (const [chain, options] of Object.entries(raw as Record<string, unknown>)) {
        const { optionsBps, defaultBps } = (options ?? {}) as {
            optionsBps?: unknown;
            defaultBps?: unknown;
        };
        if (!isBpsList(optionsBps) || !Number.isInteger(defaultBps)) continue;
        result[chain] = { optionsBps, defaultBps: defaultBps as number };
    }
    return result;
}

/**
 * Wallet-scoped swap config: the pair the form opens with plus per-chain
 * slippage presets. Either side of the pair can be pinned (`fromAssetId` /
 * `toAssetId`) and the backend fills in the other — what puts a same-chain
 * stablecoin opposite a tapped token rather than the global default.
 * Hand-written so the slippage map is validated entry by entry rather than
 * trusted as typed: a malformed chain entry falls back to client presets
 * instead of failing the whole config.
 */
export async function fetchCrossSwapConfig(
    baseUrl: string,
    walletId: string,
    selection: { fromAssetId?: string; toAssetId?: string },
    query: Record<string, string> = {}
): Promise<CrossSwapConfig> {
    const url = new URL(
        `${removeLastSlash(baseUrl)}/v2/crosschain/${encodeURIComponent(walletId)}/config`
    );
    if (selection.fromAssetId) url.searchParams.set('from_asset_id', selection.fromAssetId);
    if (selection.toAssetId) url.searchParams.set('to_asset_id', selection.toAssetId);
    for (const [key, value] of Object.entries(query)) {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    }
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
        throw new Error(`Cross-swap config request failed with status ${response.status}`);
    }
    const body = decodeCrossSwapJson(await response.json()) as {
        swapPair?: { sourceAsset?: CrossSwapAssetApi; destinationAsset?: CrossSwapAssetApi };
        slippages?: unknown;
    };
    const pair = body.swapPair;
    if (!pair?.sourceAsset || !pair.destinationAsset) {
        throw new Error('Cross-swap config carries no default pair');
    }
    return {
        defaultPair: {
            sourceAsset: normalizeCrossSwapAsset(pair.sourceAsset),
            destinationAsset: normalizeCrossSwapAsset(pair.destinationAsset)
        },
        slippages: normalizeSlippages(body.slippages)
    };
}

/**
 * Quote or prepare failure with the backend's stable machine-readable
 * `code` preserved (e.g. `pair_not_allowed` — the direction is refused
 * outright, so the UI must show "pair unavailable", not "change the
 * amount"). `code` is `undefined` for transport failures and codeless bodies.
 */
export class CrossSwapQuoteError extends Error {
    constructor(message: string, readonly code?: string) {
        super(message);
        this.name = 'CrossSwapQuoteError';
    }
}

export function isPairNotAllowedError(error: unknown): boolean {
    return error instanceof CrossSwapQuoteError && error.code === 'pair_not_allowed';
}

export function crossSwapErrorCode(error: unknown): string | undefined {
    return error instanceof CrossSwapQuoteError ? error.code : undefined;
}

/**
 * A quote that yielded no route usually carries one error per aggregator
 * (and per protocol within an aggregator), so the code the user is told
 * about is the most actionable one rather than whichever arrived first.
 * Mirrors the native apps' ordering. `undefined` when there are no errors.
 */
const PROVIDER_ERROR_PRIORITY: CrossSwapProviderErrorCode[] = [
    'country_blocked',
    'min_amount_not_met',
    'no_route',
    'asset_not_supported',
    'provider_unavailable',
    'provider_error'
];

export function crossSwapProviderErrorCode(
    errors: CrossSwapProviderError[] | undefined
): CrossSwapProviderErrorCode | undefined {
    if (!errors?.length) return undefined;
    const codes = new Set(errors.map(e => e.code));
    return PROVIDER_ERROR_PRIORITY.find(code => codes.has(code)) ?? 'provider_error';
}

async function toCrossSwapQuoteError(e: unknown): Promise<CrossSwapQuoteError> {
    if (e instanceof ResponseError) {
        try {
            const body: { error?: string; code?: string } = await e.response.clone().json();
            return new CrossSwapQuoteError(body.error ?? e.message, body.code);
        } catch {
            return new CrossSwapQuoteError(e.message);
        }
    }
    return new CrossSwapQuoteError(e instanceof Error ? e.message : String(e));
}

/**
 * The part of a quote request the native apps hold constant. No aggregator
 * list is sent, as on Android: the backend then runs its own fan-out and
 * fallbacks between partners, and naming aggregators would switch those
 * off. `include_payload` ships the signing payloads with the quote, which
 * lets the confirm screen skip the separate prepare call. A deposit address
 * is requested for every non-TON source: SwapsXYZ then answers with a
 * plain-transfer route that needs no token approval, at a worse rate than a
 * router swap and with a provider minimum; a TON source gets a full payload
 * instead because the deposit variant routes it over a pricier bridge.
 */
export const crossSwapQuoteRequestOptions = (
    sourceChainId: string
): Pick<CreateCrossSwapQuoteRequest, 'includePayload' | 'returnDepositAddress'> => ({
    includePayload: true,
    returnDepositAddress: sourceChainId.split('/')[0] !== 'ton'
});

/**
 * The one route a quote is priced and sent with, as the native apps pick it:
 * the SwapsXYZ route when one is still live, otherwise the first live one.
 * Route tags are not consulted.
 */
export const preferredCrossSwapRoute = (
    routes: CrossSwapRoute[],
    now = Date.now()
): CrossSwapRoute | undefined => {
    const live = routes.filter(route => new Date(route.dateExpire).getTime() > now);
    return live.find(route => route.aggregator === CrossSwapAggregator.Swapsxyz) ?? live[0];
};

export async function createCrossSwapQuote(
    baseUrl: string,
    request: CreateCrossSwapQuoteRequest,
    query: Record<string, string> = {},
    walletId?: string
): Promise<CrossSwapQuote> {
    try {
        return await crosschainApi(baseUrl, query).createCrossSwapQuote({
            createCrossSwapQuoteRequest: request,
            xWalletID: walletId
        });
    } catch (e) {
        throw await toCrossSwapQuoteError(e);
    }
}

export async function prepareCrossSwapRoute(
    baseUrl: string,
    routeId: string,
    approvalMode: CrossSwapApprovalMode,
    query: Record<string, string> = {},
    walletId?: string
): Promise<CrossSwapPrepare> {
    try {
        return await crosschainApi(baseUrl, query).prepareCrossSwapRoute({
            routeId,
            prepareCrossSwapRouteRequest: { approvalMode },
            xWalletID: walletId
        });
    } catch (e) {
        throw await toCrossSwapQuoteError(e);
    }
}

export async function fetchSwapAssets(
    baseUrl: string,
    params: { q?: string; limit?: number } = {},
    query: Record<string, string> = {}
): Promise<SwapAsset[]> {
    return new SwapApi(
        new Configuration({
            basePath: removeLastSlash(baseUrl),
            middleware: [extraQueryMiddleware(query)]
        })
    ).swapAssets(params);
}

const QUOTE_TIMEOUT_MS = 10_000;

export function subscribeToOmnistonStream(params: {
    baseUrl: string;
    fromAsset: string;
    toAsset: string;
    fromAmount: string;
    userAddress: string;
    slippageBps?: number;
    query?: Record<string, string>;
    onQuote: (confirmation: OmnistonSwapMessages) => void;
    onError: (error: Error) => void;
    signal?: AbortSignal;
}): { close: () => void } {
    const url = new URL(joinUrl(params.baseUrl, '/v2/swap/omniston/stream'));
    url.searchParams.set('fromAsset', params.fromAsset);
    url.searchParams.set('toAsset', params.toAsset);
    url.searchParams.set('fromAmount', params.fromAmount);
    url.searchParams.set('userAddress', params.userAddress);
    if (params.slippageBps !== undefined) {
        url.searchParams.set('slippage', String(params.slippageBps));
    }
    for (const [key, value] of Object.entries(params.query ?? {})) {
        if (!url.searchParams.has(key)) {
            url.searchParams.set(key, value);
        }
    }

    const eventSource = new EventSource(url.toString());
    let quoteTimeoutId: ReturnType<typeof setTimeout> | undefined;

    const onMessage = (event: MessageEvent<string>) => {
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'connected') {
                quoteTimeoutId = setTimeout(() => {
                    close();
                    params.onError(new Error('Quote request timed out'));
                }, QUOTE_TIMEOUT_MS);
                return;
            }

            clearTimeout(quoteTimeoutId);

            if (data.error) {
                close();
                params.onError(new Error(data.error));
                return;
            }

            params.onQuote(data as OmnistonSwapMessages);
        } catch (e) {
            clearTimeout(quoteTimeoutId);
            close();
            params.onError(e instanceof Error ? e : new Error('Failed to parse SSE message'));
        }
    };

    const onError = () => {
        close();
        params.onError(new Error('SSE connection closed'));
    };

    eventSource.addEventListener('message', onMessage);
    eventSource.addEventListener('error', onError);

    const close = () => {
        clearTimeout(quoteTimeoutId);
        eventSource.removeEventListener('message', onMessage);
        eventSource.removeEventListener('error', onError);
        eventSource.close();
    };

    if (params.signal) {
        if (params.signal.aborted) {
            close();
        } else {
            params.signal.addEventListener('abort', close, { once: true });
        }
    }

    return { close };
}
