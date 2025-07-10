import { TargetEnv } from '../AppSdk';
import { intlLocale } from '../entries/language';
import { Network } from '../entries/network';
import { DAppTrack } from '../service/urlService';
import { FetchAPI } from '../tonApiV2';
import { assertUnreachable } from '../utils/types';

export interface BootParams {
    platform: 'web' | 'desktop' | 'tablet' | 'extension' | 'pro_mobile_ios' | 'swap_widget_web';
    lang: 'en' | 'ru' | string;
    build: string; // "2.8.0"
    network: Network;
    countryCode?: string | null;
}
interface BootOptions {
    fetchApi?: FetchAPI;
    basePath?: string;
}

type TonendpointResponse<Data> = { success: false } | { success: true; data: Data };

export interface TonendpointConfig {
    flags?: { [key: string]: boolean };
    tonendpoint: string;

    tonApiV2Key?: string;
    tonapiIOEndpoint?: string;

    exchangePostUrl?: string;
    supportLink?: string;
    tonkeeperNewsUrl?: string;
    mam_learn_more_url?: string;

    mercuryoSecret?: string;

    directSupportUrl?: string;
    faq_url?: string;

    accountExplorer?: string;
    transactionExplorer?: string;
    NFTOnExplorerUrl?: string;

    featured_play_interval?: number;

    web_swaps_url?: string;
    web_swaps_referral_address?: string;

    mercuryo_otc_id?: string;

    scam_api_url?: string;

    mam_max_wallets_without_pro?: number;

    /**
     * @deprecated use ton api
     */
    tonEndpoint: string;
    /**
     * @deprecated use ton api
     */
    tonEndpointAPIKey?: string;

    multisig_help_url?: string;

    multisig_about_url?: string;

    batteryHost?: string;
    batteryMeanFees?: string;
    batteryRefundEndpoint?: string;
    batteryReservedAmount?: string;
    battery_beta?: boolean;
    disable_battery?: boolean;
    disable_battery_send?: boolean;
    battery_packages?: {
        value: number;
        image: string;
    }[];

    /**
     * "secret" flag name to determine if the app is on ios review
     */
    tablet_enable_additional_security?: boolean;

    '2fa_public_key'?: string;
    '2fa_api_url'?: string;
    '2fa_tg_confirm_send_message_ttl_seconds'?: number;
    '2fa_tg_linked_ttl_seconds'?: number;
    '2fa_bot_url'?: string;

    tron_api_url?: string;

    enhanced_acs_pmob?: {
        code?: string;
        acs_until?: number;
    };

    pro_mobile_app_appstore_link?: string;
    pro_landing_url?: string;
}

interface CountryIP {
    ip: string;
    country: string;
}

const defaultTonendpoint = 'https://api.tonkeeper.com'; //  'http://localhost:1339';

export const defaultTonendpointConfig: TonendpointConfig = {
    tonendpoint: defaultTonendpoint,
    tonEndpoint: '',
    flags: {}
};

const defaultFetch: FetchAPI = (input, init) => window.fetch(input, init);

export class Tonendpoint {
    public params: BootParams;

    public fetchApi: FetchAPI;

    public basePath: string;

    public readonly targetEnv: TargetEnv;

    constructor(
        {
            lang,
            build,
            network,
            platform,
            countryCode,
            targetEnv
        }: BootParams & { targetEnv: TargetEnv },
        { fetchApi = defaultFetch, basePath = defaultTonendpoint }: BootOptions
    ) {
        this.targetEnv = targetEnv;
        this.params = { lang, build, network, platform, countryCode };
        this.fetchApi = fetchApi;
        this.basePath = basePath;
    }

    setCountryCode = (countryCode?: string | null | undefined) => {
        this.params.countryCode = countryCode;
    };

    toSearchParams = (
        rewriteParams?: Partial<BootParams>,
        additionalParams?: Record<string, string | number>
    ) => {
        const params = new URLSearchParams({
            lang: intlLocale(rewriteParams?.lang ?? this.params.lang),
            build: rewriteParams?.build ?? this.params.build,
            chainName:
                (rewriteParams?.network ?? this.params.network) === Network.TESTNET
                    ? 'testnet'
                    : 'mainnet',
            platform: rewriteParams?.platform ?? this.params.platform
        });
        const countryCode = rewriteParams?.countryCode ?? this.params.countryCode;

        if (countryCode) {
            params.append('countryCode', countryCode);
        }

        if (!additionalParams) {
            return params.toString();
        }

        for (const key in additionalParams) {
            params.append(key, additionalParams[key].toString());
        }
        return params.toString();
    };

    boot = async (network: Network): Promise<TonendpointConfig> => {
        const response = await this.fetchApi(
            `https://boot.tonkeeper.com/keys?${this.toSearchParams({ network })}`,
            {
                method: 'GET'
            }
        );

        return response.json();
    };

    country = async (): Promise<CountryIP> => {
        const response = await this.fetchApi('https://boot.tonkeeper.com/my/ip', {
            method: 'GET'
        });

        return response.json();
    };

    GET = async <Data>(
        path: string,
        rewriteParams?: Partial<BootParams>,
        additionalParams?: Record<string, string | number>
    ): Promise<Data> => {
        const response = await this.fetchApi(
            `${this.basePath}${path}?${this.toSearchParams(rewriteParams, additionalParams)}`,
            {
                method: 'GET'
            }
        );

        const result: TonendpointResponse<Data> = await response.json();
        if (!result.success) {
            throw new Error(`Failed to get "${path}" data`);
        }

        return result.data;
    };

    getFiatMethods = (): Promise<TonendpoinFiatMethods> => {
        return this.GET('/fiat/methods');
    };

    getAppsPopular = (): Promise<Recommendations> => {
        return this.GET('/apps/popular', {}, { track: this.getTrack() });
    };

    getTrack = (): DAppTrack => {
        switch (this.targetEnv) {
            case 'desktop':
                return 'desktop';
            case 'twa':
                return 'twa';
            case 'extension':
            case 'web':
            case 'tablet':
            case 'mobile':
            case 'swap_widget_web':
                return 'extension';
            default:
                assertUnreachable(this.targetEnv);
        }
    };
}

export const getServerConfig = async (
    tonendpoint: Tonendpoint,
    network: Network
): Promise<TonendpointConfig> => {
    const result = await tonendpoint.boot(network);

    return {
        flags: {},
        ...result
    };
};

export interface TonendpoinFiatButton {
    title: string;
    url: string;
}
export interface TonendpoinFiatItem {
    id: string;
    disabled: boolean;
    title: string;
    subtitle: string;
    description: string;
    icon_url: string;
    action_button: TonendpoinFiatButton;
    badge: null;
    features: unknown[];
    info_buttons: TonendpoinFiatButton[];
    successUrlPattern: unknown;
}

export interface TonendpoinFiatCategory {
    items: TonendpoinFiatItem[];
    subtitle: string;
    title: string;
}

export interface LayoutByCountry {
    countryCode: string;
    currency: string;
    methods: string[];
}

export interface TonendpoinFiatMethods {
    layoutByCountry: LayoutByCountry[];
    defaultLayout: { methods: string[] };
    categories: TonendpoinFiatCategory[];
}

export interface CarouselApp extends PromotedApp {
    poster: string;
}

export interface PromotedApp {
    name: string;
    description: string;
    icon: string;
    url: string;
    textColor?: string;
}

export interface PromotionCategory {
    id: string;
    title: string;
    apps: PromotedApp[];
}

export interface Recommendations {
    categories: PromotionCategory[];
    apps: CarouselApp[];
}
