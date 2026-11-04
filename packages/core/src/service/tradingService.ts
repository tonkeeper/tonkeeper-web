import {
    AssetsApi,
    Configuration,
    ShelvesApi,
    type AssetCapabilities,
    type AssetDetailsResponse,
    type AssetRef,
    type AssetsFilter,
    type AssetsOrder,
    type AssetsSort,
    type AssetsTab,
    type AssetType,
    type MarketItem,
    type MarketListKey,
    type ShelfConfig,
    type ShelfType,
    type ShelvesConfigResponseV2
} from '../tradingApiGenerated';
import { shiftedDecimals } from '../utils/balance';
import { tradingApiOrigin } from './multichainEndpoints';

/**
 * Client for the TradingAPI proxy at trading.tonkeeper.com — the same backend
 * iOS (TKTradingAPI) and Android (tonapi/trading) consume, generated from the
 * vendored spec at `resource/trading-openapi.yml` (`generate:tradingApi`). The
 * proxy fronts dyor.io plus internal data sources — clients never call dyor
 * directly.
 *
 * No auth. Returns are normalised to the union of fields iOS and Android
 * render; section `enabled` flags decide whether the UI shows the
 * corresponding card or skips it.
 */
/**
 * One shared client per configured origin in production; tests inject
 * their own `fetch` per call and get a throwaway instance.
 */
let sharedClients: { origin: string; assets: AssetsApi; shelves: ShelvesApi } | undefined;

function sharedTradingClients() {
    const origin = tradingApiOrigin();
    if (sharedClients?.origin !== origin) {
        const configuration = new Configuration({ basePath: origin });
        sharedClients = {
            origin,
            assets: new AssetsApi(configuration),
            shelves: new ShelvesApi(configuration)
        };
    }
    return sharedClients;
}

function assetsApi(fetchImpl?: typeof fetch): AssetsApi {
    if (!fetchImpl) return sharedTradingClients().assets;
    return new AssetsApi(new Configuration({ basePath: tradingApiOrigin(), fetchApi: fetchImpl }));
}

function shelvesApi(fetchImpl?: typeof fetch): ShelvesApi {
    if (!fetchImpl) return sharedTradingClients().shelves;
    return new ShelvesApi(new Configuration({ basePath: tradingApiOrigin(), fetchApi: fetchImpl }));
}

/**
 * Domain aliases for the generated client's closed sets, re-exported so
 * callers don't reach into the generated package.
 */
export type TradingAssetType = AssetType;
export type TradingAssetsTab = AssetsTab;
export type TradingAssetsSort = AssetsSort;
export type TradingAssetsOrder = AssetsOrder;
export type TradingAssetsFilter = AssetsFilter;
export type TradingShelfKey = MarketListKey;
export type TradingShelfType = ShelfType;

export type AssetVerification = 'trusted' | 'whitelist' | 'none' | 'blacklist';

export interface AssetDetailsAbout {
    enabled: boolean;
    text?: string;
    /** Source attribution (`local`, `dyor`, …). */
    source?: string;
    /** Reason the section is disabled (e.g. for stocks / RWA). */
    note?: string;
}

export interface AssetDetailsOverview {
    enabled: boolean;
    marketCap?: string;
    totalSupply?: string;
    circulatingSupply?: string;
    note?: string;
}

export interface AssetDetailsTradingActivity {
    enabled: boolean;
    volumeChange24h?: string;
    volume24h?: string;
    buy24h?: string;
    sell24h?: string;
    note?: string;
}

export type AssetLinkType =
    | 'unspecified'
    | 'website'
    | 'telegram'
    | 'twitter'
    | 'facebook'
    | string;

export interface AssetLink {
    name: string;
    url: string;
    type: AssetLinkType;
}

export interface AssetDetailsLinks {
    enabled: boolean;
    items: AssetLink[];
    note?: string;
}

export interface AssetDetailsAsset {
    assetType: TradingAssetType;
    assetId: string;
    symbol: string;
    name: string;
    decimals: number;
    trustScore: number;
    image: string;
    isScam: boolean;
    verification: AssetVerification;
}

export type TradingCapability = 'onramp' | 'offramp' | 'swap' | 'p2p';

/**
 * Per-asset trade routing the server allows. Buy/Sell UI picks the flow from
 * `capabilities`; the merchant / aggregator lists parameterize that flow.
 */
export interface AssetCapabilitiesInfo {
    capabilities: TradingCapability[];
    onrampMerchants: string[];
    offrampMerchants: string[];
    swapAggregators: string[];
    p2pSymbol?: string;
}

export interface AssetDetails {
    asset: AssetDetailsAsset;
    about: AssetDetailsAbout;
    overview: AssetDetailsOverview;
    tradingActivity: AssetDetailsTradingActivity;
    links: AssetDetailsLinks;
    capabilities?: AssetCapabilitiesInfo;
    /** How fresh the data is, in seconds. */
    dataFreshnessSec: number;
}

function toAssetDetailsAsset(api: AssetRef): AssetDetailsAsset {
    return {
        assetType: api.assetType,
        assetId: api.id,
        symbol: api.symbol,
        name: api.name,
        decimals: api.decimals,
        trustScore: api.trustScore,
        image: api.imageUrl,
        isScam: api.isScam,
        verification: api.verification
    };
}

function toCapabilities(api: AssetCapabilities | undefined): AssetCapabilitiesInfo | undefined {
    if (!api) return undefined;
    return {
        capabilities: api.capabilities,
        onrampMerchants: api.details?.onramp?.merchants ?? [],
        offrampMerchants: api.details?.offramp?.merchants ?? [],
        swapAggregators: api.details?.swap?.aggregators ?? [],
        p2pSymbol: api.details?.p2p?.symbol
    };
}

/** Supply arrives in the asset's base units (nanoGRAM, satoshi, …). */
function toTokenUnits(value: string | null | undefined, decimals: number): string | undefined {
    return value ? shiftedDecimals(value, decimals).toFixed() : undefined;
}

function toAssetDetails(api: AssetDetailsResponse): AssetDetails {
    const { about, overview, tradingActivity, links } = api.sections;
    return {
        asset: toAssetDetailsAsset(api.asset),
        about: {
            enabled: about.enabled,
            text: about.text ?? undefined,
            source: about.source ?? undefined,
            note: about.note ?? undefined
        },
        overview: {
            enabled: overview.enabled,
            marketCap: overview.marketCap ?? undefined,
            totalSupply: toTokenUnits(overview.totalSupply, api.asset.decimals),
            circulatingSupply: toTokenUnits(overview.circulatingSupply, api.asset.decimals),
            note: overview.note ?? undefined
        },
        tradingActivity: {
            enabled: tradingActivity.enabled,
            volumeChange24h: tradingActivity.volumeChange24h ?? undefined,
            volume24h: tradingActivity.volume24h ?? undefined,
            buy24h: tradingActivity.buy24h ?? undefined,
            sell24h: tradingActivity.sell24h ?? undefined,
            note: tradingActivity.note ?? undefined
        },
        links: {
            enabled: links.enabled,
            items: (links.items ?? []).map(i => ({ name: i.name, url: i.url, type: i.type })),
            note: links.note ?? undefined
        },
        capabilities: toCapabilities(api.capabilities),
        dataFreshnessSec: api.dataFreshnessSec
    };
}

export interface GetAssetDetailsArgs {
    assetId: string;
    currency: string;
    /** Language for localisable texts (`about`); server defaults to `en`. */
    lang?: string;
    fetchImpl?: typeof fetch;
}

export async function getAssetDetails(args: GetAssetDetailsArgs): Promise<AssetDetails> {
    const response = await assetsApi(args.fetchImpl).getAssetDetailsV2({
        assetId: args.assetId,
        currency: args.currency.toLowerCase(),
        xLang: args.lang
    });
    return toAssetDetails(response);
}

/**
 * A market-list entry (shelf, catalog page or `ids` batch): asset identity
 * plus the summary metrics the server renders lists from. `price` and
 * `change24hPercent` are server-formatted decimal strings in the requested
 * currency.
 */
export interface TradingMarketAsset {
    assetId: string;
    assetType: TradingAssetType;
    symbol: string;
    name: string;
    decimals: number;
    image: string;
    isScam: boolean;
    verification: AssetVerification;
    trustScore: number;
    price?: string;
    change24hPercent?: string;
}

export interface TradingAssetsPage {
    items: TradingMarketAsset[];
    /** Empty string means "no more pages". */
    nextCursor: string;
    /**
     * Chain codes holding at least one asset under the request's `tab` and
     * `filter`, independent of `chain` and `query`. Sent on the first page
     * only; `undefined` when the server couldn't compute it.
     */
    chains?: string[];
}

function toMarketAsset(item: MarketItem): TradingMarketAsset {
    return {
        assetId: item.asset.id,
        assetType: item.asset.assetType,
        symbol: item.asset.symbol,
        name: item.asset.name,
        decimals: item.asset.decimals,
        image: item.asset.imageUrl,
        isScam: item.asset.isScam,
        verification: item.asset.verification,
        trustScore: item.asset.trustScore,
        price: item.metrics.price,
        change24hPercent: item.metrics.change24hPercent
    };
}

/** `tab` values the catalog still treats as tabs; the rest of {@link AssetsTab} are legacy aliases for asset-type filters. */
const CATALOG_TABS: ReadonlySet<string> = new Set<TradingAssetsTab>([
    'all',
    'tokens',
    'perpetuals'
]);
const CATALOG_FILTERS: ReadonlySet<string> = new Set<TradingAssetsFilter>([
    'all',
    'tokens',
    'stocks',
    'etfs',
    'commodities'
]);

/**
 * The sort options the catalog's pill offers, mirroring the native token
 * picker. Each is a fixed metric + direction pair: the movers are price
 * change in either direction, the rest are descending.
 */
export type TradingCatalogSorting = 'market_cap' | 'volume' | 'top_gainers' | 'top_losers';

export const CATALOG_SORTINGS: Record<
    TradingCatalogSorting,
    { sort: TradingAssetsSort; order: TradingAssetsOrder }
> = {
    market_cap: { sort: 'market_cap', order: 'desc' },
    volume: { sort: 'volume_24h', order: 'desc' },
    top_gainers: { sort: 'price_24h', order: 'desc' },
    top_losers: { sort: 'price_24h', order: 'asc' }
};

export interface TradingCatalogPreset {
    tab?: TradingAssetsTab;
    filter?: TradingAssetsFilter;
    sorting?: TradingCatalogSorting;
}

/**
 * The movers shelves have no catalog filter of their own: gainers and losers
 * are the matching sort option, most traded is volume. The trending toggles
 * carry their own metric over.
 */
const SHELF_SORTING: Record<string, TradingCatalogSorting> = {
    market_cap: 'market_cap',
    volume: 'volume',
    most_traded: 'volume',
    top_gainers: 'top_gainers',
    top_losers: 'top_losers'
};

/**
 * Catalog query a shelf's "see all" opens. The wire still types `route` as a
 * tab, but only `all` / `tokens` / `perpetuals` are tabs — the asset-class
 * values (`stocks`, `etfs`, `commodities`) are asset-type filters and go out
 * as `filter` under the `all` tab. A shelf keyed by an asset class implies
 * that filter when the route doesn't name one. Values outside both sets are
 * dropped rather than forwarded, so an unexpected server value degrades to
 * the plain catalog instead of a 400.
 */
export function catalogPresetForShelf(args: {
    shelfKey?: string;
    route?: string;
}): TradingCatalogPreset {
    const { shelfKey, route } = args;
    const preset: TradingCatalogPreset = {};
    const sorting = shelfKey ? SHELF_SORTING[shelfKey] : undefined;
    if (sorting) preset.sorting = sorting;
    if (route && CATALOG_TABS.has(route)) {
        preset.tab = route as TradingAssetsTab;
    } else if (route && CATALOG_FILTERS.has(route)) {
        preset.tab = 'all';
        preset.filter = route as TradingAssetsFilter;
    }
    if (!preset.filter && shelfKey && CATALOG_FILTERS.has(shelfKey) && shelfKey !== 'all') {
        preset.filter = shelfKey as TradingAssetsFilter;
    }
    return preset;
}

export interface GetTradingAssetsArgs {
    currency: string;
    /** `all` / `tokens` / `perpetuals`; see {@link catalogPresetForShelf}. */
    tab?: TradingAssetsTab;
    /** Prefix match on ticker or name. */
    query?: string;
    /** Restrict to one chain segment (`ton`, `eth`, `btc`, `tron`, …). */
    chain?: string;
    sort?: TradingAssetsSort;
    order?: TradingAssetsOrder;
    /** Asset-type filter within the tab; combines with `query`. */
    filter?: TradingAssetsFilter;
    /** Originating shelf key, for analytics and server-side fallback. */
    sourceShelf?: string;
    cursor?: string;
    /** Server clamps to its own bounds. */
    pageSize?: number;
    lang?: string;
    fetchImpl?: typeof fetch;
}

export async function getTradingAssets(args: GetTradingAssetsArgs): Promise<TradingAssetsPage> {
    const response = await assetsApi(args.fetchImpl).getAssetsCatalogV2({
        currency: args.currency.toLowerCase(),
        tab: args.tab,
        q: args.query,
        chain: args.chain,
        sort: args.sort,
        order: args.order,
        filter: args.filter,
        sourceShelf: args.sourceShelf,
        cursor: args.cursor,
        pageSize: args.pageSize,
        xLang: args.lang
    });
    return {
        items: (response.items ?? []).map(toMarketAsset),
        nextCursor: response.nextCursor ?? '',
        chains: response.chains
    };
}

/** Server-side cap on the `ids` batch parameter (mirrored by iOS/Android). */
const ASSETS_BY_IDS_CHUNK = 10;

export function chunkAssetIds(ids: string[], chunkSize = ASSETS_BY_IDS_CHUNK): string[][] {
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
        chunks.push(ids.slice(i, i + chunkSize));
    }
    return chunks;
}

export interface GetTradingAssetsByIdsArgs {
    ids: string[];
    currency: string;
    lang?: string;
    fetchImpl?: typeof fetch;
}

/**
 * Batch-fetch market data for specific assets (favorites hydration). The
 * endpoint accepts at most {@link ASSETS_BY_IDS_CHUNK} ids per request, so
 * larger sets fan out in parallel; the merged result preserves the requested
 * order and silently drops ids the server no longer knows.
 */
export async function getTradingAssetsByIds(
    args: GetTradingAssetsByIdsArgs
): Promise<TradingMarketAsset[]> {
    if (args.ids.length === 0) return [];
    const api = assetsApi(args.fetchImpl);
    const currency = args.currency.toLowerCase();
    const pages = await Promise.all(
        chunkAssetIds(args.ids).map(chunk =>
            api.getAssetsCatalogV2({ currency, ids: chunk, xLang: args.lang })
        )
    );
    const byId = new Map<string, TradingMarketAsset>();
    for (const page of pages) {
        for (const item of page.items ?? []) {
            const asset = toMarketAsset(item);
            byId.set(asset.assetId, asset);
        }
    }
    return args.ids.flatMap(id => {
        const asset = byId.get(id);
        return asset ? [asset] : [];
    });
}

export interface TradingShelfSeeAll {
    enabled: boolean;
    /** Catalog tab the "see all" chevron should open. */
    route: TradingAssetsTab;
}

export interface TradingShelf {
    key: TradingShelfKey;
    title: string;
    type: TradingShelfType;
    /** Upstream data source (`dyor`, `internal`, …). */
    source: string;
    seeAll: TradingShelfSeeAll;
    items: TradingMarketAsset[];
}

/** Shelves for one chain inside a shelf group (e.g. "Ethereum" under "Trending"). */
export interface TradingChainShelves {
    chain: string;
    shelves: TradingShelf[];
}

export interface TradingShelfGroup {
    id: string;
    name: string;
    chains: TradingChainShelves[];
}

/**
 * Server-composed Trade-tab layout: ordered shelf groups, each holding
 * per-chain variants. Order, titles and item sets are server-authoritative —
 * the client renders them as-is (pin/exclude/limit/geo rules live upstream).
 */
export interface TradingShelvesConfig {
    groups: TradingShelfGroup[];
}

function toShelf(api: ShelfConfig): TradingShelf {
    return {
        key: api.key,
        title: api.title,
        type: api.type,
        source: api.source,
        seeAll: { enabled: api.seeAll.enabled, route: api.seeAll.route },
        items: (api.items ?? []).map(toMarketAsset)
    };
}

function toShelvesConfig(api: ShelvesConfigResponseV2): TradingShelvesConfig {
    return {
        groups: (api.groups ?? []).map(group => ({
            id: group.id,
            name: group.name,
            chains: (group.groups ?? []).map(chainGroup => ({
                chain: chainGroup.name,
                shelves: (chainGroup.items ?? []).map(toShelf)
            }))
        }))
    };
}

export interface GetShelvesConfigArgs {
    currency: string;
    lang?: string;
    fetchImpl?: typeof fetch;
}

export async function getShelvesConfig(args: GetShelvesConfigArgs): Promise<TradingShelvesConfig> {
    const response = await shelvesApi(args.fetchImpl).getShelvesConfigV2({
        currency: args.currency.toLowerCase(),
        xLang: args.lang
    });
    return toShelvesConfig(response);
}

export interface ChartPoint {
    timestamp: number;
    price: number;
}

export interface ChartPriceChange {
    diffPercent: number;
    diffFiat: number;
}

/**
 * Change of `point` against the first point of the loaded window — the
 * baseline both native apps use for the chart header readout.
 */
export function chartPriceChange(first: ChartPoint, point: ChartPoint): ChartPriceChange {
    return {
        diffPercent: first.price ? (point.price / first.price - 1) * 100 : 0,
        diffFiat: point.price - first.price
    };
}

export interface GetAssetChartsArgs {
    assetId: string;
    currency: string;
    /** Unix seconds. */
    startDate?: number;
    /** Unix seconds. */
    endDate?: number;
    /** Total number of points to return across the [startDate, endDate] window. */
    pointsCount?: number;
    fetchImpl?: typeof fetch;
}

/**
 * Fetch chart points for an asset. The wire shape is a tuple-array
 * `[[timestamp_seconds, price], …]`, descending with duplicated boundary
 * timestamps; normalised here to deduped objects in ascending time order so
 * charts draw left-to-right without caring about tuple indices.
 */
export async function getAssetCharts(args: GetAssetChartsArgs): Promise<ChartPoint[]> {
    const raw = await assetsApi(args.fetchImpl).getAssetChartsV2({
        assetId: args.assetId,
        currency: args.currency.toLowerCase(),
        startDate: args.startDate,
        endDate: args.endDate,
        pointsCount: args.pointsCount
    });

    const seen = new Set<number>();
    const points: ChartPoint[] = [];
    for (const tuple of raw ?? []) {
        const timestamp = Number(tuple[0]);
        const price = Number(tuple[1]);
        if (!Number.isFinite(timestamp) || !Number.isFinite(price)) continue;
        if (seen.has(timestamp)) continue;
        seen.add(timestamp);
        points.push({ timestamp, price });
    }
    points.sort((a, b) => a.timestamp - b.timestamp);
    return points;
}
