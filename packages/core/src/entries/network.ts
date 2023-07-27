import { Configuration } from '../tonApiV1';
import { Configuration as ConfigurationV2 } from '../tonApiV2';
import { TonendpointConfig } from '../tonkeeperApi/tonendpoint';
import { Configuration as TronConfiguration } from '../tronApi';

export enum Network {
    MAINNET = -239,
    TESTNET = -3
}

export const defaultNetwork = Network.MAINNET;

export const switchNetwork = (current: Network): Network => {
    return current === Network.MAINNET ? Network.TESTNET : Network.MAINNET;
};

export const getTonClient = (config: TonendpointConfig, current?: Network) => {
    return new Configuration({
        basePath: current === Network.MAINNET ? 'https://tonapi.io' : 'https://testnet.tonapi.io',
        headers: {
            Authorization: `Bearer ${config.tonApiKey}`
        }
    });
};

export const getTonClientV2 = (config: TonendpointConfig, current?: Network) => {
    return new ConfigurationV2({
        basePath: current === Network.MAINNET ? 'https://tonapi.io' : 'https://testnet.tonapi.io',
        headers: {
            Authorization: `Bearer ${config.tonApiV2Key}`
        }
    });
};

// eslint-disable-next-line unused-imports/no-unused-vars,@typescript-eslint/no-unused-vars
export const getTronClient = (current?: Network) => {
    return new TronConfiguration({
        //basePath: 'http://localhost:5500'
        basePath:
            current === Network.MAINNET
                ? 'https://tron.tonkeeper.com'
                : 'https://testnet-tron.tonkeeper.com'
    });
};
