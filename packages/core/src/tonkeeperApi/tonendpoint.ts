import { Network } from '../entries/network';
import { removeLastSlash } from '../utils/url';
import { trimBuildVersion } from '../utils/appVersion';
import { intlLocale } from '../entries/language';
import {
    Configuration,
    GetAllKeys200Response,
    GetPopularApps200ResponseFromJSON,
    Middleware,
    SystemApi
} from '../tonkeeperApiGenerated';
import type {
    Currency,
    FiatCategory,
    FiatCategoryItemsInner,
    FiatCategoryItemsInnerActionButton,
    FiatCategoryItemsInnerInfoButtonsInner,
    GetFiatMethods200ResponseData,
    GetFiatMethods200ResponseDataLayoutByCountryInner,
    GetPopularApps200ResponseData,
    MyIp200Response,
    Platform,
    PopularApp,
    PopularCategory
} from '../tonkeeperApiGenerated';

export interface BootParams {
    platform: Extract<
        Platform,
        'web' | 'desktop' | 'tablet' | 'extension' | 'pro_mobile_ios' | 'twa'
    >;
    lang: 'en' | 'ru' | string;
    build: string;
    network: Network;
    store_country_code?: string;
    device_country_code?: string;
}

/**
 * Boot-config block explorer for one chain. The URL fields are templates the
 * app fills in: `url` carries `{tx_hash}`, `token_url` `{token_address}` and
 * `account_url` `{account_address}`. Token and account templates are absent
 * on chains that have no such page.
 */
export interface TonendpointChainExplorer {
    chain: string;
    name: string;
    url: string;
    token_url?: string;
    account_url?: string;
}

/**
 * Regional backend host block. `domain` is the HTTP base the client appends
 * its route paths to; `realtime` is the websocket URL where the backend has
 * one. Absent blocks mean the host compiled into the app stands.
 */
export interface TonendpointEndpoint {
    domain: string;
    realtime?: string;
}

export interface TonendpointConfig {
    flags: {
        disable_staking: boolean;
        disable_tron: boolean;
        disable_battery: boolean;
        disable_gaseless: boolean;
        disable_swap: boolean;
        disable_2fa: boolean;
        disable_signer: boolean;
        disable_exchange_methods: boolean;
        disable_dapps: boolean;
        disable_usde: boolean;
        disable_nfts: boolean;
        disable_crypto_subscription: boolean;
        /** Default safe-mode state for accounts without their own choice. */
        safe_mode_enabled: boolean;
    };

    ton_connect_bridge: string;
    tonapiV2Endpoint: string;
    tonApiV2Key?: string;
    tonapiIOEndpoint: string;
    tron_api_url: string;
    tonkeeper_api_url: string;
    pro_api_url: string;
    pro_dev_api_url: string;

    aptabaseEndpoint: string;
    aptabaseKey?: string;
    tonkeeper_utm_track: string;
    stonfi_direct_link_referral_address?: string;

    exchangePostUrl?: string;
    mercuryoSecret?: string;
    mercuryo_otc_id?: string;
    featured_play_interval: number;

    directSupportUrl?: string;
    faq_url?: string;
    supportLink?: string;
    tonkeeperNewsUrl?: string;
    scam_api_url?: string;
    faq_tron_fee_url?: string;
    stakingInfoUrl?: string;

    accountExplorer: string;
    transactionExplorer: string;
    NFTOnExplorerUrl: string;
    /** Per-chain explorers for multichain assets. Empty when the backend sends none. */
    explorers: TonendpointChainExplorer[];

    /** Multichain wallet/activity/auth backend; see {@link TonendpointEndpoint}. */
    multichain?: TonendpointEndpoint;
    /** Trading (asset catalog / market data) backend; see {@link TonendpointEndpoint}. */
    trading?: TonendpointEndpoint;

    web_swaps_url?: string;
    web_swaps_referral_address?: string;

    mam_learn_more_url?: string;
    mam_max_wallets_without_pro: number;

    multisig_help_url?: string;
    multisig_about_url?: string;

    batteryHost: string;
    batteryMeanFees: string;
    batteryRefundEndpoint?: string;
    batteryReservedAmount: string;
    disable_battery: boolean;

    /**
     * "secret" flag name to determine if the app is on ios review
     */
    tablet_enable_additional_security?: boolean;

    '2fa_public_key'?: string;
    '2fa_api_url'?: string;
    '2fa_tg_confirm_send_message_ttl_seconds': number;
    '2fa_tg_linked_ttl_seconds': number;
    '2fa_bot_url'?: string;

    /**
     * It keeps the last release version, e.g. "v1.0.0"
     */
    pro_apk_name?: string;
    pro_mobile_app_appstore_link?: string;
    pro_media_base_url?: string;
    pro_landing_url?: string;
    pro_trial_tg_bot_id?: string;

    pro_terms_of_use: string;
    privacy_policy: string;
    terms_of_use: string;
}

export const defaultTonendpointConfig: TonendpointConfig = {
    flags: {
        disable_staking: false,
        disable_tron: false,
        disable_battery: false,
        disable_gaseless: false,
        disable_swap: false,
        disable_2fa: false,
        disable_signer: false,
        disable_exchange_methods: false,
        disable_dapps: false,
        disable_usde: false,
        disable_nfts: false,
        disable_crypto_subscription: false,
        safe_mode_enabled: false
    },
    ton_connect_bridge: 'https://bridge.tonapi.io',
    tonapiV2Endpoint: 'https://keeper.tonapi.io',
    tonapiIOEndpoint: 'https://keeper.tonapi.io',
    tron_api_url: 'https://api.trongrid.io',
    batteryHost: 'https://battery.tonkeeper.com',
    tonkeeper_api_url: 'https://api.tonkeeper.com',
    pro_api_url: 'https://pro.tonconsole.com',
    pro_dev_api_url: 'https://dev-pro.tonconsole.com',
    batteryMeanFees: '0.0026',
    batteryReservedAmount: '0.065',
    disable_battery: false,
    accountExplorer: 'https://tonviewer.com/%s',
    transactionExplorer: 'https://tonviewer.com/transaction/%s',
    NFTOnExplorerUrl: 'https://tonviewer.com/nft/%s',
    explorers: [],
    featured_play_interval: 1000 * 10,
    mam_max_wallets_without_pro: 3,
    '2fa_tg_confirm_send_message_ttl_seconds': 600,
    '2fa_tg_linked_ttl_seconds': 600,
    pro_terms_of_use: 'https://tonkeeper.com/pro-terms',
    privacy_policy: 'https://tonkeeper.com/privacy',
    terms_of_use: 'https://tonkeeper.com/terms',
    aptabaseEndpoint: 'https://anonymous-analytics.tonkeeper.com',
    tonkeeper_utm_track: ''
};

/**
 * Shape returned by GET /my/ip.
 * Re-exported from the generated client.
 */
export type CountryIP = MyIp200Response;

/**
 * Fiat exchange models. Aliased to the generated OpenAPI types so the client
 * and the backend schema stay in sync.
 */
export type TonendpoinFiatMethods = GetFiatMethods200ResponseData;
export type TonendpoinFiatCategory = FiatCategory;
export type TonendpoinFiatItem = FiatCategoryItemsInner;
export type TonendpoinFiatButton =
    | FiatCategoryItemsInnerActionButton
    | FiatCategoryItemsInnerInfoButtonsInner;
export type LayoutByCountry = GetFiatMethods200ResponseDataLayoutByCountryInner;

export interface HomeBannerButton {
    type: 'link' | 'deeplink';
    payload: string;
    title: string;
}

export interface HomeBanner {
    id: string;
    title: string;
    description: string;
    image?: string;
    textColor?: string;
    backgroundColor?: string;
    chains?: string[];
    button?: HomeBannerButton;
}

/**
 * Raw popular-apps response as the backend serves it. `url`, `icon` and
 * `poster` are optional here, so this type is useful when you want to
 * inspect every entry the API returned without discarding malformed ones.
 *
 * The published OpenAPI spec omits the per-app `chains` array the backend
 * sends and the native clients read, so the generated model is widened with
 * it here and {@link Tonendpoint.appsPopular} lifts it off the raw body.
 */
export type RawPromotedApp = PopularApp & {
    /** Network codes the app targets (`'ton'`, `'eth'`, …); empty = chain-agnostic. */
    chains: string[];
};
export type RawPromotionCategory = Omit<PopularCategory, 'apps'> & { apps: RawPromotedApp[] };
export type RawRecommendations = Omit<GetPopularApps200ResponseData, 'categories' | 'apps'> & {
    categories: RawPromotionCategory[];
    apps: RawPromotedApp[];
};

const readAppChains = (rawApp: unknown): string[] => {
    if (typeof rawApp !== 'object' || rawApp === null) {
        return [];
    }
    const { chains, chain } = rawApp as { chains?: unknown; chain?: unknown };
    if (Array.isArray(chains)) {
        return chains.filter((code): code is string => typeof code === 'string' && code !== '');
    }
    // Older backends tagged an app with a single `chain` string.
    return typeof chain === 'string' && chain !== '' ? [chain] : [];
};

const withAppChains = (apps: PopularApp[], rawApps: unknown): RawPromotedApp[] =>
    apps.map((app, index) => ({
        ...app,
        chains: readAppChains(Array.isArray(rawApps) ? rawApps[index] : undefined)
    }));

const toRawRecommendations = (
    data: GetPopularApps200ResponseData,
    rawData: unknown
): RawRecommendations => {
    const raw = (typeof rawData === 'object' && rawData !== null ? rawData : {}) as {
        apps?: unknown;
        categories?: unknown;
    };
    const rawCategories = Array.isArray(raw.categories) ? raw.categories : [];
    return {
        ...data,
        apps: withAppChains(data.apps, raw.apps),
        categories: data.categories.map((category, index) => ({
            ...category,
            apps: withAppChains(
                category.apps,
                (rawCategories[index] as { apps?: unknown } | undefined)?.apps
            )
        }))
    };
};

/**
 * Narrowed views used by the browser UI. They only add the fields that the
 * UI actually treats as required (`url`, `icon` and additionally `poster`
 * for the carousel). Use the type guards below to promote raw entries to
 * these narrowed shapes after runtime validation.
 */
export type PromotedApp = RawPromotedApp & { url: string; icon: string };
export type CarouselApp = PromotedApp & { poster: string };
export type PromotionCategory = Omit<RawPromotionCategory, 'apps'> & { apps: PromotedApp[] };
export type Recommendations = Omit<RawRecommendations, 'categories' | 'apps'> & {
    categories: PromotionCategory[];
    apps: CarouselApp[];
};

export const isPromotedApp = (app: RawPromotedApp): app is PromotedApp =>
    typeof app.url === 'string' && typeof app.icon === 'string';

export const isCarouselApp = (app: RawPromotedApp): app is CarouselApp =>
    isPromotedApp(app) && typeof app.poster === 'string';

const PRIMARY_BOOT_PATH = 'https://boot.tonkeeper.com';
const FALLBACK_BOOT_PATH = 'https://block.tonkeeper.com';

/**
 * Build the query object shared by every Tonendpoint call.
 *
 * The generated `SystemApi` covers a small part of these; the rest (chainName,
 * snake-cased country codes) belong to the boot endpoint only and are applied
 * via a per-call middleware instead of duplicating the generator's logic.
 */
const toCommonQuery = (
    params: BootParams,
    rewrite?: Partial<BootParams>
): Record<string, string> => {
    const network = rewrite?.network ?? params.network;
    const deviceCountryCode = rewrite?.device_country_code ?? params.device_country_code;
    const storeCountryCode = rewrite?.store_country_code ?? params.store_country_code;

    const query: Record<string, string> = {
        lang: intlLocale(rewrite?.lang ?? params.lang),
        build: trimBuildVersion(rewrite?.build ?? params.build),
        chainName: network === Network.TESTNET ? 'testnet' : 'mainnet',
        platform: rewrite?.platform ?? params.platform
    };

    if (deviceCountryCode) {
        query.device_country_code = deviceCountryCode;
    }
    if (storeCountryCode) {
        query.store_country_code = storeCountryCode;
    }

    return query;
};

/**
 * Pre-middleware that merges extra query params into every request made by
 * the generated `SystemApi`. This keeps call sites trivial while still sending
 * the Tonkeeper-specific bookkeeping params that aren't part of the official
 * OpenAPI contract (e.g. `chainName`).
 */
const extraQueryMiddleware = (extraQuery: Record<string, string>): Middleware => ({
    pre: async ({ url, init }) => {
        const parsed = new URL(url);
        for (const [key, value] of Object.entries(extraQuery)) {
            if (!parsed.searchParams.has(key)) {
                parsed.searchParams.set(key, value);
            }
        }
        return { url: parsed.toString(), init };
    }
});

export class Tonendpoint {
    public params: BootParams;

    private tonkeeperApiUrl = defaultTonendpointConfig.tonkeeper_api_url;

    private switchToFallbackBootPath = false;

    private get bootPath() {
        return this.switchToFallbackBootPath ? FALLBACK_BOOT_PATH : PRIMARY_BOOT_PATH;
    }

    constructor({
        lang,
        build,
        network,
        platform,
        store_country_code,
        device_country_code
    }: BootParams) {
        this.params = { lang, build, network, platform, store_country_code, device_country_code };
    }

    /**
     * The common query params (`lang`, `build`, `chainName`, `platform`) sent to
     * every Tonkeeper backend. Exposed so other clients (e.g. the swaps API) can
     * attach the exact same identification params that boot/api already send.
     */
    public getCommonQueryParams = (rewrite?: Partial<BootParams>): Record<string, string> => {
        return toCommonQuery(this.params, rewrite);
    };

    boot = async (network: Network): Promise<TonendpointConfig> => {
        /**
         * `/keys/all` returns every network's block in one payload. Its
         * per-network blocks are the `/keys` payload plus `explorers`, which
         * the backend ships only on the combined endpoint (the one iOS reads).
         * `/v2/keys` is marked as the successor in the spec but does not work
         * in production, so it is not an option.
         */
        const attempt = () => this.systemApi(this.bootPath, { network }).getAllKeys({});

        let all: GetAllKeys200Response;
        try {
            all = await attempt();
        } catch (e) {
            if (this.switchToFallbackBootPath) {
                throw e;
            }
            console.error(e);
            this.switchToFallbackBootPath = true;
            all = await attempt();
        }

        const result = (network === Network.TESTNET ? all.testnet : all.mainnet) as
            | TonendpointConfig
            | undefined;
        if (!result) {
            throw new Error(`Boot config has no "${network}" block`);
        }

        if (result.tonkeeper_api_url) {
            this.tonkeeperApiUrl = removeLastSlash(result.tonkeeper_api_url);
        }
        return result;
    };

    country = (): Promise<CountryIP> => {
        return this.systemApi(this.tonkeeperApiUrl).myIp();
    };

    fiatMethods = async (): Promise<TonendpoinFiatMethods> => {
        const response = await this.systemApi(this.tonkeeperApiUrl).getFiatMethods({});
        if (!response.success || !response.data) {
            throw new Error('Failed to get "/fiat/methods" data');
        }
        return response.data;
    };

    /**
     * `walletId` is the multichain wallet's stable id. With it the backend
     * serves the wallet-scoped multichain catalog; without it, the TON-only
     * one the legacy Browser renders. Same contract as the native apps.
     */
    appsPopular = async (walletId?: string): Promise<RawRecommendations> => {
        // The typed parser drops fields the spec doesn't declare, so the body
        // is read once as JSON and the per-app `chains` are taken from it.
        const response = await this.systemApi(
            this.tonkeeperApiUrl,
            undefined,
            walletId ? { wallet_id: walletId } : undefined
        ).getPopularAppsRaw({});
        const json: unknown = await response.raw.json();
        const parsed = GetPopularApps200ResponseFromJSON(json);
        if (!parsed.success || !parsed.data) {
            throw new Error('Failed to get "/apps/popular" data');
        }
        return toRawRecommendations(parsed.data, (json as { data?: unknown }).data);
    };

    banners = async (walletId?: string): Promise<HomeBanner[]> => {
        const url = new URL(`${this.tonkeeperApiUrl}/banners`);
        Object.entries(this.getCommonQueryParams()).forEach(([key, value]) =>
            url.searchParams.set(key, value)
        );
        if (walletId) url.searchParams.set('wallet_id', walletId);

        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to get "/banners" data (${response.status})`);
        const data = (await response.json()) as { banners?: HomeBanner[] };
        return Array.isArray(data.banners) ? data.banners : [];
    };

    public supportedCurrencies = async (): Promise<Currency[]> => {
        const response = await this.systemApi(this.tonkeeperApiUrl).getCurrencies({});
        return response.currencies;
    };

    private systemApi(
        basePath: string,
        rewrite?: Partial<BootParams>,
        extraQuery?: Record<string, string>
    ): SystemApi {
        return new SystemApi(
            new Configuration({
                basePath,
                middleware: [
                    extraQueryMiddleware({ ...toCommonQuery(this.params, rewrite), ...extraQuery })
                ]
            })
        );
    }
}

export const getServerConfig = async (
    tonendpoint: Tonendpoint,
    network: Network
): Promise<TonendpointConfig> => {
    const result = await tonendpoint.boot(network);

    return {
        ...defaultTonendpointConfig,
        ...result,
        flags: {
            ...defaultTonendpointConfig.flags,
            ...result.flags
        }
    };
};
