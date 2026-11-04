import BigNumber from 'bignumber.js';
import queryString from 'query-string';
import { seeIfValidTonAddress, seeIfValidTronAddress } from '../utils/common';
import { networkOfEip155ChainId } from './walletConnect/wcChains';
import { TON_CONNECT_MSG_VARIANTS_ID, TonConnectTransactionPayload } from '../entries/tonConnect';
import {
    Address,
    beginCell,
    Cell,
    comment,
    CommonMessageInfoRelaxedInternal,
    storeStateInit
} from '@ton/core';
import { DNSApi } from '../tonApiV2';
import { APIConfig } from '../entries/apis';
import { JettonEncoder, JettonWalletNotFound } from './ton-blockchain/encoder/jetton-encoder';
import { TonAsset } from '../entries/crypto/asset/ton-asset';

export function seeIfBringToFrontLink(options: { url: string }) {
    const { query } = queryString.parseUrl(options.url);

    if (typeof query.ret === 'string' && query.v == null) {
        return { ret: query.ret };
    } else {
        return null;
    }
}

export interface TonTransferParams {
    address?: string;
    amount?: string;
    text?: string;
    jetton?: string;
}

export interface TronTransferParams {
    address?: string;
    amount?: string;
}

export interface SwapDeeplinkParams {
    fromToken?: string;
    toToken?: string;
}

export interface PoolDeeplinkParams {
    poolAddress: string;
}

export interface BrowserDeeplinkParams {
    /** Network code of the catalog chain filter to preselect, e.g. `eth`. */
    network?: string;
}

/** `deposit` / `withdraw` — the ramp hints the native apps accept. */
export interface RampDeeplinkParams {
    fromToken?: string;
    toToken?: string;
    fromNetwork?: string;
    toNetwork?: string;
    cashMethod?: string;
    itemType?: string;
}

export interface TradingDeeplinkParams {
    /** Shelf to open the crypto catalog on; absent opens the Trade tab. */
    shelf?: string;
}

export interface TradeAssetDeeplinkParams {
    /** Canonical asset id, `chain/network/type/address`. */
    assetId: string;
}

export interface DappDeeplinkParams {
    url: string;
}

const TETHER_SIGN = '\u20ae';

export const normalizeSwapDeeplinkToken = (value: string) =>
    value.trim().toUpperCase().replace(new RegExp(TETHER_SIGN, 'g'), 'T');

export const findSwapAssetByDeeplinkToken = (assets: TonAsset[], token: string) => {
    const trimmedToken = token.trim();
    const normalizedToken = normalizeSwapDeeplinkToken(trimmedToken);
    const tokenAddress = seeIfValidTonAddress(trimmedToken)
        ? Address.parse(trimmedToken)
        : undefined;

    return assets.find(asset => {
        const normalizedSymbol = normalizeSwapDeeplinkToken(asset.symbol);
        const normalizedStringAddress =
            typeof asset.address === 'string'
                ? normalizeSwapDeeplinkToken(asset.address)
                : undefined;

        return (
            normalizedSymbol === normalizedToken ||
            normalizedStringAddress === normalizedToken ||
            (tokenAddress !== undefined &&
                Address.isAddress(asset.address) &&
                tokenAddress.equals(asset.address))
        );
    });
};

export function parseSwapDeeplink(url: string): SwapDeeplinkParams | null {
    try {
        const data = queryString.parseUrl(url);
        const paths = getUrlPaths(data.url);

        if (paths.length !== 1 || paths[0] !== 'swap') {
            return null;
        }

        const fromToken = typeof data.query.ft === 'string' ? data.query.ft : undefined;
        const toToken = typeof data.query.tt === 'string' ? data.query.tt : undefined;

        return { fromToken, toToken };
    } catch (e) {
        return null;
    }
}

export function parsePoolDeeplink(url: string): PoolDeeplinkParams | null {
    try {
        const data = queryString.parseUrl(url);
        const paths = getUrlPaths(data.url);

        if (paths.length !== 2 || paths[0] !== 'pool') {
            return null;
        }

        const poolAddress = paths[1];
        if (!poolAddress) {
            return null;
        }

        return { poolAddress };
    } catch (e) {
        return null;
    }
}

/**
 * Matches a link whose only path segment is one of `names`
 * (`tonkeeper://battery`, `https://app.tonkeeper.com/battery/`).
 */
function parseSingleSegmentDeeplink(url: string, names: string[]): true | null {
    try {
        const data = queryString.parseUrl(url);
        const paths = getUrlPaths(data.url);

        if (paths.length !== 1 || !names.includes(paths[0])) {
            return null;
        }

        return true;
    } catch (e) {
        return null;
    }
}

export function parseBuyTonDeeplink(url: string): true | null {
    return parseSingleSegmentDeeplink(url, ['buy-ton']);
}

export function parseBatteryDeeplink(url: string): true | null {
    return parseSingleSegmentDeeplink(url, ['battery']);
}

/** Raffle CTAs come from the backend as `migrate`; universal links use `migration`. */
export function parseMigrationDeeplink(url: string): true | null {
    return parseSingleSegmentDeeplink(url, ['migration', 'migrate']);
}

export function parseStakingDeeplink(url: string): true | null {
    return parseSingleSegmentDeeplink(url, ['staking']);
}

export function parseReceiveDeeplink(url: string): true | null {
    return parseSingleSegmentDeeplink(url, ['receive']);
}

export function parseBackupDeeplink(url: string): true | null {
    return parseSingleSegmentDeeplink(url, ['backup']);
}

export function parseAddWalletDeeplink(url: string): true | null {
    return parseSingleSegmentDeeplink(url, ['add-wallet']);
}

/** iOS names the home `main`; Android's tab link names it `wallet`. */
export function parseMainDeeplink(url: string): true | null {
    return parseSingleSegmentDeeplink(url, ['main', 'wallet']);
}

export function parseBrowserDeeplink(url: string): BrowserDeeplinkParams | null {
    try {
        const data = queryString.parseUrl(url);
        const paths = getUrlPaths(data.url);

        if (paths.length === 0 || paths[0] !== 'browser') {
            return null;
        }

        return typeof data.query.network === 'string' && data.query.network !== ''
            ? { network: data.query.network.toLowerCase() }
            : {};
    } catch (e) {
        return null;
    }
}

function parseRampDeeplink(url: string, name: 'deposit' | 'withdraw'): RampDeeplinkParams | null {
    try {
        const data = queryString.parseUrl(url);
        const paths = getUrlPaths(data.url);

        if (paths.length !== 1 || paths[0] !== name) {
            return null;
        }

        const read = (key: string) =>
            typeof data.query[key] === 'string' && data.query[key] !== ''
                ? (data.query[key] as string)
                : undefined;

        return {
            fromToken: read('ft'),
            toToken: read('tt'),
            fromNetwork: read('fn'),
            toNetwork: read('tn'),
            cashMethod: read('cm'),
            itemType: read('it')?.trim().toLowerCase()
        };
    } catch (e) {
        return null;
    }
}

export function parseDepositDeeplink(url: string): RampDeeplinkParams | null {
    return parseRampDeeplink(url, 'deposit');
}

export function parseWithdrawDeeplink(url: string): RampDeeplinkParams | null {
    return parseRampDeeplink(url, 'withdraw');
}

/** iOS carries the shelf as a path segment, Android as `?shelf=`. */
export function parseTradingDeeplink(url: string): TradingDeeplinkParams | null {
    try {
        const data = queryString.parseUrl(url);
        const paths = getUrlPaths(data.url);

        if (paths.length === 0 || paths.length > 2 || paths[0] !== 'trading') {
            return null;
        }

        const shelf =
            paths[1] ?? (typeof data.query.shelf === 'string' ? data.query.shelf : undefined);
        return shelf ? { shelf } : {};
    } catch (e) {
        return null;
    }
}

/**
 * `assets/<asset id>`. The id's address tail may itself contain `/`, so
 * everything after the first segment is the id.
 */
export function parseTradeAssetDeeplink(url: string): TradeAssetDeeplinkParams | null {
    try {
        const data = queryString.parseUrl(url);
        const paths = getUrlPaths(data.url);

        if (paths.length < 2 || paths[0] !== 'assets') {
            return null;
        }

        const assetId = paths.slice(1).map(decodeURIComponent).join('/');
        return splitAssetId(assetId) ? { assetId } : null;
    } catch (e) {
        return null;
    }
}

/**
 * `dapp/<url>`. The remainder of the link is the dApp URL as the natives
 * read it: percent-decoded, `https://` assumed when no scheme is present.
 */
export function parseDappDeeplink(url: string): DappDeeplinkParams | null {
    try {
        const paths = getUrlPaths(queryString.parseUrl(url).url);
        if (paths.length < 2 || paths[0] !== 'dapp') {
            return null;
        }

        const match = /\/dapp\/(.+)$/i.exec(url);
        if (!match) {
            return null;
        }

        let target = match[1];
        try {
            target = decodeURIComponent(target);
        } catch (e) {
            /* keep the raw value when it is not valid percent-encoding */
        }
        if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(target)) {
            target = `https://${target}`;
        }

        const parsed = new URL(target);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            return null;
        }
        return { url: parsed.toString() };
    } catch (e) {
        return null;
    }
}

export interface AssetIdTransferParams {
    /** Canonical asset id, `chain/network/type/address`. */
    assetId: string;
    address?: string;
    amount?: string;
    text?: string;
}

/**
 * The first three id segments are fixed lowercase keys; the address tail
 * may itself contain `/`, so it is rejoined rather than indexed.
 */
function splitAssetId(assetId: string): { network: string; type: string; address: string } | null {
    const segments = assetId.split('/');
    if (segments.length < 3 || segments.slice(0, 3).some(s => s === '')) {
        return null;
    }
    return {
        network: segments[0].toLowerCase(),
        type: segments[2].toLowerCase(),
        address: segments.slice(3).join('/')
    };
}

/**
 * A transfer link addressing an asset by its canonical id. The recipient
 * is passed through untouched — which chains it is valid on is for the
 * send form to decide, since the id may name any chain.
 */
export function parseAssetIdTransfer(url: string): AssetIdTransferParams | null {
    try {
        const data = queryString.parseUrl(url);
        const paths = getUrlPaths(data.url);

        if (paths.length !== 2 || paths[0] !== 'transfer') {
            return null;
        }

        const assetId = typeof data.query.asset_id === 'string' ? data.query.asset_id : null;
        if (!assetId || splitAssetId(assetId) === null) {
            return null;
        }

        return {
            assetId,
            address: paths[1],
            amount: typeof data.query.amount === 'string' ? data.query.amount : undefined,
            text: typeof data.query.text === 'string' ? data.query.text : undefined
        };
    } catch (e) {
        return null;
    }
}

/**
 * A `ton/...` asset id is the canonical spelling of what the legacy
 * `jetton` param (or its absence, for the native coin) already encodes.
 * Such links are rewritten into the legacy form so they follow the
 * existing TON pipeline — including the confirm screen for
 * amount-bearing links and DNS recipient resolution. Per the deeplink
 * contract, `asset_id` wins over a conflicting `jetton` param.
 *
 * Returns `null` when the link carries no TON coin/jetton asset id.
 */
export function rewriteTonAssetIdToLegacyLink(url: string): string | null {
    const transfer = parseAssetIdTransfer(url);
    if (!transfer) {
        return null;
    }

    const segments = splitAssetId(transfer.assetId)!;
    if (segments.network !== 'ton' || (segments.type !== 'coin' && segments.type !== 'jetton')) {
        return null;
    }
    if (segments.type === 'jetton' && segments.address === '') {
        return null;
    }

    const data = queryString.parseUrl(url);
    const query = { ...data.query };
    delete query.asset_id;
    if (segments.type === 'jetton') {
        query.jetton = segments.address;
    } else {
        delete query.jetton;
    }
    return queryString.stringifyUrl({ url: data.url, query });
}

const EVM_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{40}$/;

export interface EthereumTransferParams {
    address: string;
    /** Canonical asset id, present when the link carries a chain id. */
    assetId?: string;
    /**
     * ERC-20 contract from a link without a chain id — names a token but
     * not a network, so it has to be probed across the wallet's EVM
     * assets.
     */
    erc20Contract?: string;
    /** Atomic units of the named asset. */
    amount?: string;
}

function splitOnce(value: string, separator: string): [string, string | undefined] {
    const index = value.indexOf(separator);
    if (index === -1) return [value, undefined];
    return [value.slice(0, index), value.slice(index + 1)];
}

/** First occurrence of a name wins, as duplicated params are undefined behaviour. */
function parseErc681Query(query: string | undefined): Record<string, string> {
    if (!query) return {};
    const result: Record<string, string> = {};
    for (const pair of query.split('&')) {
        const [name, value] = splitOnce(pair, '=');
        if (name === '' || value === undefined || name in result) continue;
        try {
            result[name] = decodeURIComponent(value);
        } catch (e) {
            result[name] = value;
        }
    }
    return result;
}

/** The largest power of ten that still fits a `uint256`. */
const ERC681_MAX_EXPONENT = 78;

const ERC681_AMOUNT_PATTERN = /^\+?\d+(\.\d+)?([eE]\d+)?$/;

/**
 * ERC-681 numbers are decimal with an optional power-of-ten exponent
 * (`2.014e18`). The value must come out as a whole number of atomic
 * units — otherwise the link cannot be honoured exactly — and the
 * exponent is capped so an absurd one cannot turn into an arbitrarily
 * large allocation.
 */
function erc681AtomicUnits(raw: string): string | null {
    if (!ERC681_AMOUNT_PATTERN.test(raw)) return null;
    const value = new BigNumber(raw);
    if (!value.isFinite() || !value.isInteger() || value.e === null) return null;
    if (value.e > ERC681_MAX_EXPONENT) return null;
    return value.toFixed(0);
}

/**
 * `null` invalidates the whole link — a malformed amount must not
 * silently open the send form with an empty field — while `undefined`
 * simply means the link named no amount.
 */
function erc681OptionalAmount(raw: string | undefined): string | null | undefined {
    if (raw === undefined) return undefined;
    return erc681AtomicUnits(raw);
}

/**
 * ERC-681 transaction request URLs, carried by the ERC-831 `ethereum:` /
 * `eth:` scheme with an optional `pay-` prefix. Only plain value
 * transfers and ERC-20 `transfer` calls map onto the send flow — every
 * other function, and any target that is not a hex address, is rejected.
 *
 * A link without `@chain_id` pins no network: a native transfer then
 * carries only the recipient (the amount would be denominated in
 * whichever coin the user ends up picking), and an ERC-20 transfer
 * carries the contract for probing.
 */
export function parseEthereumTransferLink(url: string): EthereumTransferParams | null {
    const trimmed = url.trim();
    const lower = trimmed.toLowerCase();
    const scheme = ['ethereum:', 'eth:'].find(s => lower.startsWith(s));
    if (!scheme) return null;

    let body = trimmed.slice(scheme.length);
    if (body.toLowerCase().startsWith('pay-')) {
        body = body.slice('pay-'.length);
    } else if (!body.toLowerCase().startsWith('0x')) {
        // ERC-831 allows arbitrary use-case prefixes; only `pay-` maps
        // onto a transfer, and a bare payload is a transfer only when it
        // starts with an address rather than an ENS name.
        return null;
    }

    const [head, query] = splitOnce(body, '?');
    const [targetAndChain, fn] = splitOnce(head, '/');
    const [target, rawChainId] = splitOnce(targetAndChain, '@');

    if (!EVM_ADDRESS_PATTERN.test(target)) return null;

    let network: string | undefined;
    if (rawChainId !== undefined) {
        if (!/^\d+$/.test(rawChainId)) return null;
        network = networkOfEip155ChainId(Number(rawChainId));
        if (network === undefined) return null;
    }

    const params = parseErc681Query(query);

    switch (fn?.toLowerCase() ?? '') {
        case '': {
            const amount = erc681OptionalAmount(params.value);
            if (amount === null) return null;
            if (network === undefined) {
                return { address: target };
            }
            return { address: target, assetId: `${network}/mainnet/coin`, amount };
        }
        case 'transfer': {
            const recipient = params.address;
            if (recipient === undefined || !EVM_ADDRESS_PATTERN.test(recipient)) return null;
            const amount = erc681OptionalAmount(params.uint256);
            if (amount === null) return null;
            if (network === undefined) {
                return { address: recipient, erc20Contract: target, amount };
            }
            return {
                address: recipient,
                assetId: `${network}/mainnet/erc20/${target}`,
                amount
            };
        }
        default:
            return null;
    }
}

export function parseTonTransferWithAddress(options: { url: string }) {
    try {
        const data = queryString.parseUrl(options.url);

        const paths = trimTrailingEmptyPathSegments(data.url.split('/'));

        let linkAddress: string;
        if (paths.length === 0) {
            throw new Error('Empty link');
        } else if (paths.length === 1 && seeIfValidTonAddress(options.url)) {
            linkAddress = paths[0];
        } else {
            const [operator, address] = paths.slice(-2);
            if (operator === 'transfer' && seeIfValidTonAddress(address)) {
                linkAddress = address;
            } else {
                throw new Error('unknown operator ' + data.url);
            }
        }

        if (data.query.bin) {
            throw new Error('Unsupported link');
        }

        const result: Omit<TonTransferParams, 'address'> & { address: string } = {
            address: linkAddress,
            ...data.query
        };

        return result;
    } catch (e) {
        return null;
    }
}

class LinkExpiredError extends Error {}

// eslint-disable-next-line complexity
export async function parseTonTransaction(
    url: string,
    {
        api,
        walletAddress,
        batteryResponse,
        gaslessResponse
    }: {
        api: APIConfig;
        walletAddress: string;
        batteryResponse: string;
        gaslessResponse?: string;
    }
): Promise<
    | {
          type: 'complex';
          params: TonConnectTransactionPayload;
      }
    | {
          type: 'simple';
          params: Omit<TonTransferParams, 'address'> & { address: string };
      }
    | null
> {
    try {
        const data = queryString.parseUrl(url);

        const paths = getUrlPaths(data.url);

        if (paths.length !== 2 || paths[0] !== 'transfer') {
            throw new Error('Unsupported link');
        }

        const addrParam = paths[1];
        if (typeof addrParam !== 'string') {
            throw new Error('Unsupported link: wrong address');
        }

        let to = undefined;
        if (seeIfValidTonAddress(addrParam)) {
            to = addrParam;
        } else {
            const result = await new DNSApi(api.tonApiV2).dnsResolve({ domainName: addrParam });
            if (result.wallet?.address && seeIfValidTonAddress(result.wallet?.address)) {
                to = result.wallet?.address;
            } else {
                throw new Error('Unsupported link: wrong dns');
            }
        }

        let value: string;
        if (data.query.amount && typeof data.query.amount === 'string') {
            if (isFinite(parseInt(data.query.amount))) {
                value = data.query.amount;
            } else {
                throw new Error('Unsupported link: no amount');
            }
        } else {
            return {
                type: 'simple',
                params: {
                    address: to,
                    text: typeof data.query.text === 'string' ? data.query.text : undefined,
                    jetton: typeof data.query.jetton === 'string' ? data.query.jetton : undefined
                }
            };
        }

        let validUntil = Math.ceil(Date.now() / 1000 + 5 * 60);
        if (
            data.query.exp &&
            typeof data.query.exp === 'string' &&
            isFinite(parseInt(data.query.exp))
        ) {
            validUntil = parseInt(data.query.exp);
            if (validUntil - 10 < Date.now() / 1000) {
                throw new LinkExpiredError('Unsupported link: expired');
            }
        }

        let payload = undefined;
        if (data.query.bin && typeof data.query.bin === 'string') {
            payload = data.query.bin;
        }

        if (data.query.text && typeof data.query.text === 'string') {
            if (payload !== undefined) {
                throw new Error('Unsupported link: payload and text');
            }

            payload = comment(data.query.text).toBoc().toString('base64');
        }

        if (data.query.jetton && typeof data.query.jetton === 'string') {
            const jetton = data.query.jetton;
            if (!seeIfValidTonAddress(jetton)) {
                throw new Error('Unsupported link: wrong jetton address');
            }

            const params = {
                valid_until: validUntil,
                messages: await encodeJettonMessage(
                    { to, value, payload, jetton },
                    { api, walletAddress }
                ),
                messagesVariants: {
                    [TON_CONNECT_MSG_VARIANTS_ID.BATTERY]: {
                        messages: await encodeJettonMessage(
                            { to, value, payload, jetton, responseAddress: batteryResponse },
                            { api, walletAddress }
                        )
                    },
                    ...(gaslessResponse
                        ? {
                              [TON_CONNECT_MSG_VARIANTS_ID.GASLESS]: {
                                  messages: await encodeJettonMessage(
                                      {
                                          to,
                                          value,
                                          payload,
                                          jetton,
                                          responseAddress: gaslessResponse
                                      },
                                      { api, walletAddress }
                                  ),
                                  options: {
                                      asset: jetton
                                  }
                              }
                          }
                        : {})
                }
            } satisfies TonConnectTransactionPayload;
            return {
                type: 'complex',
                params
            };
        }

        let stateInit = undefined;
        if (data.query.init && typeof data.query.init === 'string') {
            stateInit = data.query.init;
        }

        const params = {
            valid_until: validUntil,
            messages: [
                {
                    address: to,
                    amount: value,
                    payload,
                    stateInit
                }
            ]
        } satisfies TonConnectTransactionPayload;
        return {
            type: 'complex',
            params
        };
    } catch (e) {
        if (e instanceof LinkExpiredError) {
            throw e;
        }
        if (e instanceof JettonWalletNotFound) {
            throw new JettonWalletNotFound('Insufficient jetton funds');
        }

        console.error(e);
        return null;
    }
}

export function parseTronTransferWithAddress(options: { url: string }) {
    try {
        const data = queryString.parseUrl(options.url);

        let url = data.url;
        if (url.startsWith('tron:')) {
            url = url.slice(5);
        }

        if (!url) {
            throw new Error('Empty link');
        }

        if (!seeIfValidTronAddress(url)) {
            throw new Error('Unsupported link');
        }

        const address = url;
        const amount = typeof data.query.amount === 'string' ? parseFloat(data.query.amount) : NaN;

        if (isFinite(amount)) {
            return {
                address,
                amount
            };
        }

        return { address };
    } catch (e) {
        return null;
    }
}

async function encodeJettonMessage(
    {
        to,
        value,
        payload,
        jetton,
        responseAddress
    }: { to: string; value: string; payload?: string; jetton: string; responseAddress?: string },
    {
        api,
        walletAddress
    }: {
        api: APIConfig;
        walletAddress: string;
    }
) {
    const je = new JettonEncoder(api, walletAddress);
    const jettonTransfer = await je.encodeTransfer({
        to,
        amount: {
            asset: {
                address: Address.parse(jetton)
            },
            stringWeiAmount: value
        },
        responseAddress,
        payload: payload
            ? {
                  type: 'raw',
                  value: Cell.fromBase64(payload)
              }
            : undefined
    });

    if (jettonTransfer.messages.length !== 1) {
        throw new Error('Unsupported link: wrong jetton encoding result');
    }

    const msg = jettonTransfer.messages[0];
    const info = msg.info as CommonMessageInfoRelaxedInternal;

    return [
        {
            address: info.dest.toRawString(),
            amount: info.value.coins.toString(),
            payload: msg.body.toBoc().toString('base64'),
            stateInit: msg.init
                ? beginCell().store(storeStateInit(msg.init)).endCell().toBoc().toString('base64')
                : undefined
        }
    ] satisfies TonConnectTransactionPayload['messages'];
}

const getUrlPaths = (url: string) => {
    const paths = url.split('/');

    const u = new URL(url);
    if (u.protocol === 'http:' || u.protocol === 'https:') {
        let sliced = paths.slice(3);

        /**
         * remove pro path prefix from the universal link
         */
        if (sliced[0] === 'pro') {
            sliced = sliced.slice(1);
        }

        return trimTrailingEmptyPathSegments(sliced);
    }

    return trimTrailingEmptyPathSegments(paths.slice(2));
};

const trimTrailingEmptyPathSegments = (paths: string[]) => {
    const result = [...paths];
    while (result.length > 0 && result[result.length - 1] === '') {
        result.pop();
    }
    return result;
};
