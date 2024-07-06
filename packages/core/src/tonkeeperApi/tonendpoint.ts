import { TargetEnv } from '../AppSdk';
import { intlLocale } from '../entries/language';
import { Network } from '../entries/network';
import { DAppTrack } from '../service/urlService';
import { FetchAPI } from '../tonApiV2';

export interface BootParams {
    platform: 'ios' | 'android' | 'web' | 'desktop';
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

    tonApiKey?: string;
    tonApiV2Key?: string;
    tonapiIOEndpoint?: string;

    amplitudeKey?: string;

    exchangePostUrl?: string;
    supportLink?: string;
    tonkeeperNewsUrl?: string;

    mercuryoSecret?: string;
    neocryptoWebView?: string;

    directSupportUrl?: string;
    faq_url?: string;

    accountExplorer?: string;
    transactionExplorer?: string;
    NFTOnExplorerUrl?: string;

    featured_play_interval?: number;

    notcoin_burn_date?: number;
    notcoin_burn_addresses?: string[];

    web_swaps_url?: string;
    web_swaps_referral_address?: string;

    mercuryo_otc_id?: string;

    scam_api_url?: string;

    /**
     * @deprecated use ton api
     */
    tonEndpoint: string;
    /**
     * @deprecated use ton api
     */
    tonEndpointAPIKey?: string;
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
            lang = 'en',
            build = '3.0.0',
            network = Network.MAINNET,
            platform = 'web',
            countryCode,
            targetEnv
        }: Partial<BootParams> & { targetEnv: TargetEnv },
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

    boot = async (): Promise<TonendpointConfig> => {
        const response = await this.fetchApi(
            `https://boot.tonkeeper.com/keys?${this.toSearchParams()}`,
            {
                method: 'GET'
            }
        );

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

    getFiatMethods = (countryCode?: string | null | undefined): Promise<TonendpoinFiatMethods> => {
        return this.GET('/fiat/methods', { countryCode });
    };

    getAppsPopular = (countryCode?: string | null | undefined): Promise<Recommendations> => {
        return this.GET('/apps/popular', { countryCode }, { track: this.getTrack() });
    };

    getTrack = (): DAppTrack => {
        switch (this.targetEnv) {
            case 'desktop':
                return 'desktop';
            case 'twa':
                return 'twa';
            case 'extension':
            case 'web':
            default:
                return 'extension';
        }
    };
}

export const getServerConfig = async (tonendpoint: Tonendpoint): Promise<TonendpointConfig> => {
    const result = await tonendpoint.boot();

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
