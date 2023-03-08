import { Network } from '../entries/network';
import { FetchAPI } from '../tonApiV1';
import { TonendpointStock } from './stock';

interface BootParams {
  platform: 'ios' | 'android';
  lang: 'en' | 'ru';
  build: string; // "2.8.0"
  network: Network;
}
interface BootOptions {
  fetchApi?: FetchAPI;
  basePath?: string;
}

type TonendpointResponse<Data> =
  | { success: false }
  | { success: true; data: Data };

export interface TonendpointConfig {
  flags?: { [key: string]: boolean };
  tonendpoint: string;

  tonApiKey?: string;
  tonapiIOEndpoint?: string;

  amplitudeKey?: string;

  NFTOnExplorerUrl?: string;

  exchangePostUrl?: string;
  supportLink?: string;

  mercuryoSecret?: string;
  neocryptoWebView?: string;
}

const defaultTonendpoint = 'https://api.tonkeeper.com'; //  'http://localhost:1339';

export const defaultTonendpointConfig: TonendpointConfig = {
  tonendpoint: defaultTonendpoint,
  flags: {},
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
      platform = 'ios',
    }: Partial<BootParams>,
    { fetchApi = defaultFetch, basePath = defaultTonendpoint }: BootOptions
  ) {
    this.params = { lang, build, network, platform };
    this.fetchApi = fetchApi;
    this.basePath = basePath;
  }

  toSearchParams = () => {
    const params = new URLSearchParams({
      lang: this.params.lang,
      build: this.params.build,
      chainName:
        this.params.network === Network.TESTNET ? 'testnet' : 'mainnet',
      platform: this.params.platform,
    });
    return params.toString();
  };

  boot = async (): Promise<TonendpointConfig> => {
    const response = await this.fetchApi(
      `${this.basePath}/keys?${this.toSearchParams()}`,
      { method: 'GET' }
    );

    return await response.json();
  };

  GET = async <Data>(path: string): Promise<Data> => {
    const response = await this.fetchApi(
      `${this.basePath}${path}?${this.toSearchParams()}`,
      { method: 'GET' }
    );

    const result: TonendpointResponse<Data> = await response.json();
    if (!result.success) {
      throw new Error(`Failed to get "${path}" data`);
    }

    return result.data;
  };
}

export const getServerConfig = async (
  tonendpoint: Tonendpoint
): Promise<TonendpointConfig> => {
  const result = await tonendpoint.boot();

  return {
    flags: {},
    ...result,
  };
};

export const getStock = async (tonendpoint: Tonendpoint) => {
  return await tonendpoint.GET<TonendpointStock>('/stock');
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
export interface TonendpoinFiatMethods {
  categories: TonendpoinFiatCategory[];
}

export const getFiatMethods = async (tonendpoint: Tonendpoint) => {
  return await tonendpoint.GET<TonendpoinFiatMethods>('/fiat/methods');
};
