import { TargetEnv } from '../AppSdk';
import { intlLocale } from '../entries/language';
import { Network } from '../entries/network';
import { DAppTrack } from '../service/urlService';
import { FetchAPI } from '../tonApiV2';
import { assertUnreachable } from '../utils/types';

export interface BootParams {
    platform: 'web' | 'desktop' | 'tablet' | 'extension' | 'pro_mobile_ios' | 'swap_widget_web';
    lang: 'en' | 'ru' | string;
    build: string;
    network: Network;
    countryCode?: string | null;
}
interface BootOptions {
    fetchApi?: FetchAPI;
    basePath?: string;
}

type TonendpointResponse<Data> = { success: false } | { success: true; data: Data };

export interface TonendpointConfig {
    flags: {
        disable_staking: boolean;
        disable_tron: boolean;
        disable_battery: boolean;
        disable_gaseless: boolean;
        diable_swaps: boolean;
        disable_2fa: boolean;
    };

    ton_connect_bridge: string;
    tonapiV2Endpoint: string;
    tonApiV2Key?: string;
    tonapiIOEndpoint: string;
    tron_api_url: string;

    exchangePostUrl?: string;
    mercuryoSecret?: string;
    mercuryo_otc_id?: string;
    featured_play_interval: number;

    directSupportUrl?: string;
    faq_url?: string;
    supportLink?: string;
    tonkeeperNewsUrl?: string;
    scam_api_url?: string;

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

    enhanced_acs_pmob?: {
        code?: string;
        acs_until?: number;
    };

    pro_mobile_app_appstore_link?: string;
    pro_landing_url?: string;

    pro_terms_of_use: string;
    privacy_policy: string;
    terms_of_use: string;
}

const defaultTonendpointUrl = 'https://api.tonkeeper.com';

export const defaultTonendpointConfig: TonendpointConfig = {
    flags: {
        disable_staking: false,
        disable_tron: false,
        disable_battery: false,
        disable_gaseless: false,
        diable_swaps: false,
        disable_2fa: false
    },
    ton_connect_bridge: 'https://bridge.tonapi.io',
    tonapiV2Endpoint: 'https://keeper.tonapi.io',
    tonapiIOEndpoint: 'https://keeper.tonapi.io',
    tron_api_url: 'https://api.trongrid.io',
    batteryHost: 'https://battery.tonkeeper.com',
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
    terms_of_use: 'https://tonkeeper.com/terms'
};

interface CountryIP {
    ip: string;
    country: string;
}

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
        { fetchApi = defaultFetch, basePath = defaultTonendpointUrl }: BootOptions = {}
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
        ...defaultTonendpointConfig,
        ...result,
        flags: {
            ...defaultTonendpointConfig.flags,
            ...result.flags
        }
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
