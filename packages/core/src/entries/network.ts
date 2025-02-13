import { Configuration as ConfigurationV2 } from '../tonApiV2';
import { OpenAPI as TonConsoleApi } from '../tonConsoleApi';
import { TonendpointConfig } from '../tonkeeperApi/tonendpoint';

export enum Network {
    MAINNET = -239,
    TESTNET = -3
}

export const defaultNetwork = Network.MAINNET;

export const switchNetwork = (current: Network): Network => {
    return current === Network.MAINNET ? Network.TESTNET : Network.MAINNET;
};

export const getTonClientV2 = (config: TonendpointConfig, current?: Network) => {
    return new ConfigurationV2({
        basePath:
            current === Network.MAINNET ? 'https://keeper.tonapi.io' : 'https://testnet.tonapi.io',
        headers: {
            Authorization: `Bearer ${config.tonApiV2Key}`
        }
    });
};

export const getApiConfig = (config: TonendpointConfig, network: Network, TonConsoleBase = '') => {
    // Global config
    if (TonConsoleBase) {
        TonConsoleApi.BASE = TonConsoleBase;
        TonConsoleApi.WITH_CREDENTIALS = true;
    }

    return {
        tonApiV2: getTonClientV2(config, network)
    };
};
