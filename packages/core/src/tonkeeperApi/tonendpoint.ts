import { Network } from '../entries/network';
import { removeLastSlash } from '../utils/url';
import { intlLocale } from '../entries/language';

export interface BootParams {
    platform:
        | 'web'
        | 'desktop'
        | 'tablet'
        | 'extension'
        | 'pro_mobile_ios'
        | 'swap_widget_web'
        | 'twa';
    lang: 'en' | 'ru' | string;
    build: string;
    network: Network;
    store_country_code?: string;
    device_country_code?: string;
}

type TonendpointResponse<Data> = { success: false } | { success: true; data: Data };

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
        disable_rub: boolean;
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

    pro_apk_name?: string;
    pro_apk_download_url?: string;
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
        disable_rub: false
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

interface CountryIP {
    ip: string;
    country: string;
}

export class Tonendpoint {
    public params: BootParams;

    private tonkeeperApiUrl = defaultTonendpointConfig.tonkeeper_api_url;

    private readonly primaryBootPath = 'https://boot.tonkeeper.com';

    private readonly fallbackBootPath = 'https://block.tonkeeper.com';

    private switchToFallbackBootPath = false;

    private get bootPath() {
        if (this.switchToFallbackBootPath) {
            return this.fallbackBootPath;
        }

        return this.primaryBootPath;
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
        let response;
        try {
            response = await this.fetchBoot(network);
        } catch (e) {
            if (this.switchToFallbackBootPath) {
                throw e;
            }

            console.error(e);
            this.switchToFallbackBootPath = true;
            response = await this.fetchBoot(network);
        }

        const result: TonendpointConfig = await response.json();
        if (result.tonkeeper_api_url) {
            this.tonkeeperApiUrl = removeLastSlash(result.tonkeeper_api_url);
        }
        return result;
    };

    country = async (): Promise<CountryIP> => {
        const response = await fetch(`${this.tonkeeperApiUrl}/my/ip`, {
            method: 'GET'
        });

        return response.json();
    };

    fiatMethods = (): Promise<TonendpoinFiatMethods> => {
        return this.GET('/fiat/methods');
    };

    appsPopular = (): Promise<Recommendations> => {
        return this.GET('/apps/popular');
    };

    private fetchBoot(network: Network) {
        return fetch(`${this.bootPath}/keys?${this.toSearchParams({ network })}`);
    }

    private GET = async <Data>(path: string): Promise<Data> => {
        const response = await fetch(`${this.tonkeeperApiUrl}${path}?${this.toSearchParams()}`);

        const result: TonendpointResponse<Data> = await response.json();
        if (!result.success) {
            throw new Error(`Failed to get "${path}" data`);
        }

        return result.data;
    };

    private toSearchParams = (rewriteParams?: Partial<BootParams>) => {
        const params = new URLSearchParams({
            lang: intlLocale(rewriteParams?.lang ?? this.params.lang),
            build: rewriteParams?.build ?? this.params.build,
            chainName:
                (rewriteParams?.network ?? this.params.network) === Network.TESTNET
                    ? 'testnet'
                    : 'mainnet',
            platform: rewriteParams?.platform ?? this.params.platform
        });

        const device_country_code =
            rewriteParams?.device_country_code ?? this.params.device_country_code;
        if (device_country_code) {
            params.append('device_country_code', device_country_code);
        }

        const store_country_code =
            rewriteParams?.store_country_code ?? this.params.store_country_code;
        if (store_country_code) {
            params.append('store_country_code', store_country_code);
        }

        return params.toString();
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
