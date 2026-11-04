import BigNumber from 'bignumber.js';

import { ChainId } from '../chains/types';
import { WalletVersion } from '../entries/wallet';
import {
    Asset,
    AssetFromJSON,
    GetWalletAssets200ResponseFromJSON
} from '../multichainApiGenerated';
import { createMultichainAuthorizedFetch } from './chainkit/multichainApiAuth';
import { multichainApiBaseUrl } from './multichainEndpoints';

/**
 * Non-2xx answer from the wallet API. Carries the status so callers can
 * tell a rejected request (4xx — retrying it cannot succeed) from a
 * transient failure.
 */
export class MultichainApiHttpError extends Error {
    constructor(message: string, public readonly status: number) {
        super(message);
        this.name = 'MultichainApiHttpError';
    }
}

/**
 * Union of the backend's curated-list and scam classification.
 * `trusted` — top-tier curated asset, gets a checkmark badge.
 * `whitelist` — listed asset, rendered normally with no badge.
 * `none` — unknown asset, rendered with an "unverified" warning.
 * `blacklist` — backend-classified scam.
 */
export type MultichainAssetVerification = 'trusted' | 'whitelist' | 'none' | 'blacklist';

export function isVerifiedMultichainAsset(verification: MultichainAssetVerification): boolean {
    return verification === 'trusted' || verification === 'whitelist';
}

const ASSET_VERIFICATIONS: readonly MultichainAssetVerification[] = [
    'trusted',
    'whitelist',
    'none',
    'blacklist'
];

/**
 * The API declares `verification` required, and the native clients fail
 * the whole payload when it is missing. The web keeps the row but never
 * promotes it: a missing or unrecognised value renders as unverified.
 */
export function toMultichainAssetVerification(value: unknown): MultichainAssetVerification {
    return ASSET_VERIFICATIONS.find(v => v === value) ?? 'none';
}

/**
 * The stand-in art the backend serves as a token's `image` when it has
 * none: an 88px PNG (`https://tonkeeper.com/assets/tokens/Placeholder.png`),
 * usually behind the tonapi imgproxy, whose URL-safe base64 of that source
 * is the second marker. It would render as a blurry raster on a retina
 * screen, so clients treat it as "no image" and draw their own vector
 * placeholder instead.
 */
const PLACEHOLDER_TOKEN_IMAGE_MARKERS = [
    'tonkeeper.com/assets/tokens/Placeholder.png',
    'aHR0cHM6Ly90b25rZWVwZXIuY29tL2Fzc2V0cy90b2tlbnMvUGxhY2Vob2xkZXIucG5n'
];

export function isPlaceholderTokenImage(url: string | undefined): boolean {
    return !!url && PLACEHOLDER_TOKEN_IMAGE_MARKERS.some(marker => url.includes(marker));
}

/**
 * Backend asset row. Mirrors the OpenAPI shape both native apps consume
 * (see `MultichainAPI.Types.AssetInfo` in iOS, `Asset` model in Android).
 *
 * `balance` is a string in the chain's smallest unit (wei / satoshi /
 * nanoton / sun / etc.); the UI converts via `decimals`.
 */
export interface MultichainWalletAsset {
    assetId: string;
    chain: ChainId;
    name: string;
    symbol: string;
    decimals: number;
    image: string;
    verification: MultichainAssetVerification;
    balance: string;
    isHidden: boolean;
    price?: BigNumber;
    diff24h?: string;
    /**
     * The registered account this balance belongs to. One seed registers
     * several accounts on the same chain (TON v4R2 and W5 at least), and
     * the backend answers with one row per account; `accountType` uses
     * the backend's `WalletAccount.type` vocabulary (`v4R2`, `v5R1`,
     * `p2wpkh`, …) and is absent for chains with a single account model.
     */
    accountAddress?: string;
    accountType?: string;
}

/**
 * The backend's `WalletAccount.type` name for a TON wallet version — the
 * value the register call sends and the asset rows echo back.
 */
export function tonAccountType(version: WalletVersion): string {
    switch (version) {
        case WalletVersion.V3R1:
            return 'v3R1';
        case WalletVersion.V3R2:
            return 'v3R2';
        case WalletVersion.V4R1:
            return 'v4R1';
        case WalletVersion.V4R2:
            return 'v4R2';
        case WalletVersion.V5_BETA:
            return 'v5Beta';
        case WalletVersion.V5R1:
            return 'v5R1';
        default:
            return String(version);
    }
}

/** Account types the client owns per chain; chains absent here are not filtered. */
export type MultichainOwnedAccountTypes = Partial<Record<ChainId, readonly string[]>>;

/**
 * The accounts a multichain account can actually display and spend from.
 * The backend indexes every TON version registered under the seed-derived
 * wallet id — by this client and by the native apps — but the account
 * holds one TON wallet at a time, so only that version's rows are its own.
 * Bitcoin is derived as native segwit only (`m/84'`).
 */
export function multichainOwnedAccountTypes(account: {
    activeTonWallet: { version: WalletVersion };
}): MultichainOwnedAccountTypes {
    return multichainOwnedAccountTypesForTonVersions([account.activeTonWallet.version]);
}

/**
 * Owned account types for several TON versions at once — the whole of a
 * seed's registered TON accounts when several local accounts hold its
 * versions and their balances are summed together.
 */
export function multichainOwnedAccountTypesForTonVersions(
    versions: readonly WalletVersion[]
): MultichainOwnedAccountTypes {
    return {
        ton: versions.map(tonAccountType),
        btc: ['p2wpkh']
    };
}

/**
 * `true` for a row of an account this client does not own: a TON version
 * registered under the same wallet id by another device, for instance.
 * Rows without an account type, and chains with no owned-type list, are
 * never foreign. Same rule as iOS' `filteringForeignAccounts`.
 */
export function isForeignAccountAsset(
    asset: Pick<MultichainWalletAsset, 'chain' | 'accountType'>,
    owned: MultichainOwnedAccountTypes
): boolean {
    const ownedTypes = owned[asset.chain];
    if (!ownedTypes || asset.accountType === undefined) return false;
    return !ownedTypes.includes(asset.accountType);
}

/** Fiat value of the rows that carry a price; unpriced rows count as zero. */
export function sumAssetsFiat(assets: readonly MultichainWalletAsset[]): BigNumber {
    return assets.reduce((sum, a) => {
        if (!a.price) return sum;
        const human = new BigNumber(a.balance).shiftedBy(-a.decimals);
        return sum.plus(human.multipliedBy(a.price));
    }, new BigNumber(0));
}

/**
 * Whole-wallet total once foreign-account rows are dropped. The backend's
 * `fiat_price` covers rows the client cannot value itself (unknown
 * chains, unpriced assets), so it stays the anchor and the dropped rows'
 * value is subtracted from it. Only when a dropped row cannot be valued
 * does the total fall back to summing the remaining rows.
 */
export function totalFiatWithoutForeignAccounts(
    backendTotal: BigNumber | undefined,
    own: readonly MultichainWalletAsset[],
    foreign: readonly MultichainWalletAsset[]
): BigNumber {
    if (backendTotal === undefined) return sumAssetsFiat(own);
    if (foreign.length === 0) return backendTotal;
    if (foreign.some(a => !a.price)) return sumAssetsFiat(own);
    return BigNumber.max(backendTotal.minus(sumAssetsFiat(foreign)), 0);
}

export interface MultichainWalletAssetsResponse {
    assets: MultichainWalletAsset[];
    /**
     * Backend-computed total fiat value of the wallet, keyed by currency
     * code (e.g. `{"USD": "123.45"}`), one entry per requested currency.
     * Computed relative to the query it answers — pagination (`limit`/
     * `cursor`) and filters skew it — so to get the whole-wallet total,
     * request with no limit and no filters and read this field instead
     * of summing `assets`. iOS reads it the same way
     * (`portfolioFiatTotalAndCurrency`).
     */
    fiatPrice: Record<string, string>;
    /** Empty string means "no more pages". */
    nextCursor: string;
}

/**
 * `eth/mainnet/coin` → `'evm'`; `tron/mainnet/trc20/<addr>` → `'tron'`.
 * Returns `undefined` for chain segments the web side doesn't recognise
 * yet (e.g. arbitrary L2s the backend lists). Callers should drop those
 * rows rather than render them with no chain context.
 */
function chainIdFromAssetId(assetId: string): ChainId | undefined {
    const head = assetId.split('/')[0];
    switch (head) {
        case 'ton':
            return 'ton';
        case 'tron':
            return 'tron';
        case 'eth':
        case 'evm':
        case 'arb':
        case 'base':
        case 'bsc':
        case 'polygon':
        case 'avalanche':
            return 'evm';
        case 'btc':
            return 'btc';
        case 'sol':
            return 'sol';
        default:
            return undefined;
    }
}

/**
 * The generated `Asset` row narrowed to what the UI reads. `price` is
 * declared required by the spec but the backend omits it for assets it
 * cannot quote, and the generated decoder passes that absence through.
 */
function normalizeAsset(entry: Asset, currency: string): MultichainWalletAsset | undefined {
    const chain = chainIdFromAssetId(entry.asset.assetId);
    if (!chain) return undefined;
    const upper = currency.toUpperCase();
    const price: Asset['price'] | undefined = entry.price;
    const priceNum = price?.prices?.[upper];
    return {
        assetId: entry.asset.assetId,
        chain,
        name: entry.asset.name,
        symbol: entry.asset.symbol,
        decimals: entry.asset.decimals,
        image: entry.asset.image,
        verification: toMultichainAssetVerification(entry.asset.verification),
        balance: entry.balance,
        isHidden: entry.isHidden,
        price: typeof priceNum === 'number' ? new BigNumber(priceNum) : undefined,
        diff24h: price?.diff24h?.[upper],
        accountAddress: entry.address || undefined,
        accountType: entry.type || undefined
    };
}

export interface GetMultichainWalletAssetsArgs {
    walletId: string;
    /** Wallet root key for `X-Wallet-Authorization`; without it the request carries the device JWT only. */
    walletAuthKey?: string;
    currency: string;
    chain?: string;
    search?: string;
    availableOnly?: boolean;
    showHidden?: boolean;
    /** Safe mode: ask the backend to return only verified assets. */
    verifiedOnly?: boolean;
    /**
     * Drop assets whose held balance is worth $0.01 or less (including
     * tokens the backend cannot price). The response's `fiat_price` total
     * excludes them too, so the total always matches the filtered list.
     */
    hideDust?: boolean;
    limit?: number;
    cursor?: string;
    fetchImpl?: typeof fetch;
}

export type AssetFilterAction = 'show' | 'hide';

export interface AssetFilterChange {
    assetId: string;
    action: AssetFilterAction;
}

export interface SaveMultichainAssetsFiltersArgs {
    walletId: string;
    walletAuthKey?: string;
    changes: AssetFilterChange[];
    fetchImpl?: typeof fetch;
}

/**
 * Persist user's per-asset visibility choices. Mirrors iOS
 * (`saveWalletAssetsFilters`) and Android (`saveWalletAssetsFilters`)
 * — POST body `{changes: [{asset_id, action}]}` where action is
 * `show | hide`. The backend stores the filter set per wallet and
 * returns it on subsequent `GET /assets` calls via `is_hidden`.
 */
export async function saveMultichainAssetsFilters(
    args: SaveMultichainAssetsFiltersArgs
): Promise<void> {
    if (args.changes.length === 0) return;
    const fetchImpl = createMultichainAuthorizedFetch(
        { walletId: args.walletId, walletAuthKey: args.walletAuthKey },
        args.fetchImpl ?? fetch
    );
    const url = `${multichainApiBaseUrl()}/wallets/${encodeURIComponent(args.walletId)}/assets`;
    const body = {
        changes: args.changes.map(c => ({ asset_id: c.assetId, action: c.action }))
    };
    const response = await fetchImpl(url, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error(`saveMultichainAssetsFilters: ${response.status} ${response.statusText}`);
    }
}

export async function getMultichainWalletAssets(
    args: GetMultichainWalletAssetsArgs
): Promise<MultichainWalletAssetsResponse> {
    const fetchImpl = createMultichainAuthorizedFetch(
        { walletId: args.walletId, walletAuthKey: args.walletAuthKey },
        args.fetchImpl ?? fetch
    );
    const params = new URLSearchParams();
    params.append('currencies', args.currency.toLowerCase());
    if (args.chain) params.append('chain', args.chain);
    if (args.search) params.append('search', args.search);
    if (args.availableOnly) params.append('available_only', 'true');
    if (args.showHidden) params.append('show_hidden', 'true');
    if (args.verifiedOnly) params.append('verified_only', 'true');
    if (args.hideDust) params.append('hide_dust', 'true');
    if (args.limit !== undefined) params.append('limit', String(args.limit));
    if (args.cursor) params.append('cursor', args.cursor);

    const url = `${multichainApiBaseUrl()}/wallets/${encodeURIComponent(
        args.walletId
    )}/assets?${params.toString()}`;

    const response = await fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
        throw new MultichainApiHttpError(
            `getMultichainWalletAssets: ${response.status} ${response.statusText} for wallet ${args.walletId}`,
            response.status
        );
    }

    const body = GetWalletAssets200ResponseFromJSON(await response.json());
    const assets = (body.assets ?? [])
        .map(entry => normalizeAsset(entry, args.currency))
        .filter((a): a is MultichainWalletAsset => a !== undefined);

    return {
        assets,
        fiatPrice: body.fiatPrice ?? {},
        nextCursor: body.nextCursor ?? ''
    };
}

export interface GetOwnMultichainWalletAssetsArgs {
    walletId: string;
    walletAuthKey?: string;
    ownedAccountTypes: MultichainOwnedAccountTypes;
    currency: string;
    /** Safe mode: ask the backend to return only verified assets. */
    verifiedOnly?: boolean;
    hideDust?: boolean;
    fetchImpl?: typeof fetch;
}

export interface OwnMultichainWalletAssets {
    assets: MultichainWalletAsset[];
    /** Whole-wallet total over `assets`, in `currency`. */
    totalFiat: BigNumber;
}

/**
 * Every asset the account itself holds, with the matching wallet total.
 *
 * The backend computes `fiat_price` relative to the query it receives — a
 * `limit` or `available_only` filter skews the returned total — so the
 * requests carry no params beyond the currency (the query iOS' home
 * screen sends) and the first page's `fiat_price` is the whole-wallet
 * total. The deliberate exceptions are safe mode's `verified_only` and
 * the dust filter's `hide_dust`: with them the total excludes exactly the
 * assets the list hides. The backend still paginates at its default page
 * size, so `next_cursor` is followed to collect the full list.
 *
 * Rows of accounts this client does not own (see
 * {@link isForeignAccountAsset}) are dropped and their value leaves the
 * total. Visibility is per wallet, not per account: the backend keeps a
 * zero-balance asset visible while any account of the wallet holds it, so
 * an own row at zero whose foreign twin holds a balance is only the other
 * version's asset showing through and is dropped too. Pages are cut from a
 * value-sorted list whose order can shift between requests, so an asset
 * near a page boundary can arrive twice; the first copy wins — it is the
 * one in the backend's intended position.
 */
export async function getOwnMultichainWalletAssets(
    args: GetOwnMultichainWalletAssetsArgs
): Promise<OwnMultichainWalletAssets> {
    const assets: MultichainWalletAsset[] = [];
    const foreign: MultichainWalletAsset[] = [];
    const seen = new Set<string>();
    let backendTotalFiat: BigNumber | undefined;
    let cursor: string | undefined;

    do {
        const response = await getMultichainWalletAssets({
            walletId: args.walletId,
            walletAuthKey: args.walletAuthKey,
            currency: args.currency,
            cursor,
            verifiedOnly: args.verifiedOnly || undefined,
            hideDust: args.hideDust || undefined,
            fetchImpl: args.fetchImpl
        });
        for (const asset of response.assets) {
            if (isForeignAccountAsset(asset, args.ownedAccountTypes)) {
                foreign.push(asset);
                continue;
            }
            if (seen.has(asset.assetId)) continue;
            seen.add(asset.assetId);
            assets.push(asset);
        }
        backendTotalFiat ??= parseBackendTotalFiat(response.fiatPrice, args.currency);
        cursor = response.nextCursor || undefined;
    } while (cursor);

    const heldByForeignAccount = new Set(
        foreign.filter(a => !new BigNumber(a.balance).isZero()).map(a => a.assetId)
    );
    const own = assets.filter(
        a => !(heldByForeignAccount.has(a.assetId) && new BigNumber(a.balance).isZero())
    );

    return {
        assets: own,
        totalFiat: totalFiatWithoutForeignAccounts(backendTotalFiat, own, foreign)
    };
}

export interface GetMultichainWalletAssetArgs {
    walletId: string;
    walletAuthKey?: string;
    assetId: string;
    currency: string;
    fetchImpl?: typeof fetch;
}

/**
 * Fetch one asset of a registered wallet. The list endpoint answers within
 * its own filters — an asset the wallet hides is simply absent from it — so
 * this is the only way to read the real balance and `is_hidden` of a hidden
 * asset. Android's `findAccount` uses it for the same reason. Resolves to
 * `undefined` when the backend doesn't index the asset for this wallet.
 */
export async function getMultichainWalletAsset(
    args: GetMultichainWalletAssetArgs
): Promise<MultichainWalletAsset | undefined> {
    const fetchImpl = createMultichainAuthorizedFetch(
        { walletId: args.walletId, walletAuthKey: args.walletAuthKey },
        args.fetchImpl ?? fetch
    );
    const params = new URLSearchParams();
    params.append('asset_id', args.assetId);
    params.append('currencies', args.currency.toLowerCase());

    const url = `${multichainApiBaseUrl()}/wallets/${encodeURIComponent(
        args.walletId
    )}/asset?${params.toString()}`;

    const response = await fetchImpl(url, {
        method: 'GET',
        headers: { Accept: 'application/json' }
    });

    if (response.status === 404) return undefined;
    if (!response.ok) {
        throw new MultichainApiHttpError(
            `getMultichainWalletAsset: ${response.status} ${response.statusText} for ${args.assetId}`,
            response.status
        );
    }

    return normalizeAsset(AssetFromJSON(await response.json()), args.currency);
}

/**
 * Read the whole-wallet total out of the backend's `fiat_price` map. The
 * casing of its keys isn't guaranteed, so both are tried.
 */
export function parseBackendTotalFiat(
    fiatPrice: Record<string, string>,
    currency: string
): BigNumber | undefined {
    const raw = fiatPrice[currency.toUpperCase()] ?? fiatPrice[currency.toLowerCase()];
    if (raw === undefined || raw.trim() === '') return undefined;
    const value = new BigNumber(raw);
    return value.isFinite() ? value : undefined;
}
