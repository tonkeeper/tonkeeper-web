import { Configuration as ConfigurationV2 } from '../tonApiV2';
import { OpenAPI as TonConsoleApi } from '../tonConsoleApi';
import { TonendpointConfig } from '../tonkeeperApi/tonendpoint';
import { Configuration as TronConfiguration } from '../tronApi';
import { TronApi, TronChain } from './tron';

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

const getTronClient = (current?: Network) => {
    return new TronConfiguration({
        basePath: TronApi[current === Network.MAINNET ? TronChain.MAINNET : TronChain.NILE]
    });
};

export const getApiConfig = (config: TonendpointConfig, network?: Network, TonConsoleBase = '') => {
    // Global config
    TonConsoleApi.BASE = TonConsoleBase;

    return {
        tonApiV2: getTonClientV2(config, network),
        tronApi: getTronClient(network)
    };
};

