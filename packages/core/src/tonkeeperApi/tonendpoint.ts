import { Network } from '../entries/network';
import { FetchAPI } from '../tonApiV1';

interface BootParams {
    platform: 'ios' | 'android' | 'web';
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

    accountExplorer?: string;
    transactionExplorer?: string;
    NFTOnExplorerUrl?: string;

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

    constructor(
        {
            lang = 'en',
            build = '3.0.0',
            network = Network.MAINNET,
            platform = 'web',
            countryCode
        }: Partial<BootParams>,
        { fetchApi = defaultFetch, basePath = defaultTonendpoint }: BootOptions
    ) {
        this.params = { lang, build: '3.5.0', network, platform, countryCode };
        this.fetchApi = fetchApi;
        this.basePath = basePath;
    }

    toSearchParams = () => {
        const params = new URLSearchParams({
            lang: this.params.lang,
            build: this.params.build,
            chainName: this.params.network === Network.TESTNET ? 'testnet' : 'mainnet',
            platform: this.params.platform
        });
        if (this.params.countryCode) {
            params.append('countryCode', this.params.countryCode);
        }
        return params.toString();
    };

    boot = async (): Promise<TonendpointConfig> => {
        const response = await this.fetchApi(`${this.basePath}/keys?${this.toSearchParams()}`, {
            method: 'GET'
        });

        return response.json();
    };

    GET = async <Data>(path: string): Promise<Data> => {
        const response = await this.fetchApi(`${this.basePath}${path}?${this.toSearchParams()}`, {
            method: 'GET'
        });

        const result: TonendpointResponse<Data> = await response.json();
        if (!result.success) {
            throw new Error(`Failed to get "${path}" data`);
        }

        return result.data;
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

export const getFiatMethods = async (tonendpoint: Tonendpoint) => {
    return tonendpoint.GET<TonendpoinFiatMethods>('/fiat/methods');
};

export interface TonendpoinTime {
    time: number;
}
export const getServerTime = async (tonendpoint: Tonendpoint) => {
    return tonendpoint.GET<TonendpoinTime>('/v1/system/time');
};
