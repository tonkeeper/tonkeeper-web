import { Configuration as ConfigurationV2 } from '../tonApiV2';
import { OpenAPI as TonConsoleApi } from '../pro';
import { TonendpointConfig } from '../tonkeeperApi/tonendpoint';
import { getAppVersionHeaders } from '../utils/appVersion';

export enum Network {
    MAINNET = -239,
    TESTNET = -3
}

export const defaultNetwork = Network.MAINNET;

export const switchNetwork = (current: Network): Network => {
    return current === Network.MAINNET ? Network.TESTNET : Network.MAINNET;
};

export const getTonClientV2 = (config: TonendpointConfig) => {
    const headers: Record<string, string> = {};
    if (config.tonApiV2Key) {
        headers['Authorization'] = `Bearer ${config.tonApiV2Key}`;
    }
    return new ConfigurationV2({
        basePath: config.tonapiV2Endpoint,
        headers
    });
};

export const setProApiUrl = (url: string) => {
    TonConsoleApi.BASE = url;
    TonConsoleApi.WITH_CREDENTIALS = false;
    TonConsoleApi.CREDENTIALS = 'omit';
    // Resolved per request so it always reflects the current app version/platform.
    TonConsoleApi.HEADERS = () => Promise.resolve(getAppVersionHeaders());
};

export const getApiConfig = (config: TonendpointConfig) => {
    return {
        tonApiV2: getTonClientV2(config)
    };
};
