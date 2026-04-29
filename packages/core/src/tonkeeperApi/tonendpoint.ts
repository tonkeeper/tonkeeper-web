import { Network } from '../entries/network';
import { removeLastSlash } from '../utils/url';
import { intlLocale } from '../entries/language';
import { Configuration, Middleware, SystemApi } from '../tonkeeperApiGenerated';
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
        'web' | 'desktop' | 'tablet' | 'extension' | 'pro_mobile_ios' | 'swap_widget_web' | 'twa'
    >;
    lang: 'en' | 'ru' | string;
    build: string;
    network: Network;
    store_country_code?: string;
    device_country_code?: string;
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

    accountExplorer: string;
    transactionExplorer: string;
    NFTOnExplorerUrl: string;

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
    battery_packages: {
        value: number;
        image: string;
    }[];

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
        disable_crypto_subscription: false
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
    battery_packages: [
        {
            value: 1000,
            image: 'https://wallet.tonkeeper.com/img/battery/battery-max.png'
        },
        {
            value: 400,
            image: 'https://wallet.tonkeeper.com/img/battery/battery-100.png'
        },
        {
            value: 250,
            image: 'https://wallet.tonkeeper.com/img/battery/battery-75.png'
        },
        {
            value: 150,
            image: 'https://wallet.tonkeeper.com/img/battery/battery-25.png'
        }
    ],
    accountExplorer: 'https://tonviewer.com/%s',
    transactionExplorer: 'https://tonviewer.com/transaction/%s',
    NFTOnExplorerUrl: 'https://tonviewer.com/nft/%s',
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

/**
 * Raw popular-apps response exactly as the backend declares it in the
 * OpenAPI spec. `url`, `icon` and `poster` are optional here, so this type
 * is useful when you want to inspect every entry the API returned without
 * discarding malformed ones.
 */
export type RawRecommendations = GetPopularApps200ResponseData;
export type RawPromotedApp = PopularApp;
export type RawPromotionCategory = PopularCategory;

/**
 * Narrowed views used by the browser UI. They only add the fields that the
 * UI actually treats as required (`url`, `icon` and additionally `poster`
 * for the carousel). Use the type guards below to promote raw entries to
 * these narrowed shapes after runtime validation.
 */
export type PromotedApp = PopularApp & { url: string; icon: string };
export type CarouselApp = PromotedApp & { poster: string };
export type PromotionCategory = Omit<PopularCategory, 'apps'> & { apps: PromotedApp[] };
export type Recommendations = Omit<GetPopularApps200ResponseData, 'categories' | 'apps'> & {
    categories: PromotionCategory[];
    apps: CarouselApp[];
};

export const isPromotedApp = (app: PopularApp): app is PromotedApp =>
    typeof app.url === 'string' && typeof app.icon === 'string';

export const isCarouselApp = (app: PopularApp): app is CarouselApp =>
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
        build: rewrite?.build ?? params.build,
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

    boot = async (network: Network): Promise<TonendpointConfig> => {
        /**
         * NOTE: the OpenAPI spec marks `GET /keys` as deprecated and points
         * to `GET /v2/keys` as the successor, but per the backend team that
         * flag is incorrect — `/v2/keys` does not actually work in production
         * and `/keys` is the real, supported endpoint. There is no plan to
         * migrate; we just call `/keys` and wait for the spec to be corrected.
         */
        const attempt = () => this.systemApi(this.bootPath, { network }).getKeys({});

        let result: TonendpointConfig;
        try {
            result = (await attempt()) as TonendpointConfig;
        } catch (e) {
            if (this.switchToFallbackBootPath) {
                throw e;
            }
            console.error(e);
            this.switchToFallbackBootPath = true;
            result = (await attempt()) as TonendpointConfig;
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

    appsPopular = async (): Promise<RawRecommendations> => {
        const response = await this.systemApi(this.tonkeeperApiUrl).getPopularApps({});
        if (!response.success || !response.data) {
            throw new Error('Failed to get "/apps/popular" data');
        }
        return response.data;
    };

    public supportedCurrencies = async (): Promise<Currency[]> => {
        const response = await this.systemApi(this.tonkeeperApiUrl).getCurrencies({});
        return response.currencies;
    };

    private systemApi(basePath: string, rewrite?: Partial<BootParams>): SystemApi {
        return new SystemApi(
            new Configuration({
                basePath,
                middleware: [extraQueryMiddleware(toCommonQuery(this.params, rewrite))]
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
