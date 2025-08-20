import { Configuration as ConfigurationV2 } from '../tonApiV2';
import { OpenAPI as TonConsoleApi } from '../pro';
import { TonendpointConfig } from '../tonkeeperApi/tonendpoint';

export enum Network {
    MAINNET = -239,
    TESTNET = -3
}

export const defaultNetwork = Network.MAINNET;

export const switchNetwork = (current: Network): Network => {
    return current === Network.MAINNET ? Network.TESTNET : Network.MAINNET;
};

export const getTonClientV2 = (config: TonendpointConfig) => {
    return new ConfigurationV2({
        basePath: config.tonapiV2Endpoint,
        headers: {
            Authorization: `Bearer ${config.tonApiV2Key}`
        }
    });
};

export const setProApiUrl = (url: string) => {
    TonConsoleApi.BASE = url;
    TonConsoleApi.WITH_CREDENTIALS = false;
    TonConsoleApi.CREDENTIALS = 'omit';
};

export const getApiConfig = (config: TonendpointConfig) => {
    return {
        tonApiV2: getTonClientV2(config)
    };
};
