import { Configuration } from '../tonApiV1';
import { Configuration as ConfigurationV2 } from '../tonApiV2';
import { TonendpointConfig } from '../tonkeeperApi/tonendpoint';

export enum Network {
  MAINNET = -239,
  TESTNET = -3,
}

export const defaultNetwork = Network.MAINNET;

export const switchNetwork = (current: Network): Network => {
  return current === Network.MAINNET ? Network.TESTNET : Network.MAINNET;
};

export const getTonClient = (config: TonendpointConfig, current?: Network) => {
  return new Configuration({
    basePath:
      current === Network.MAINNET
        ? 'https://dev.tonapi.io'
        : 'https://testnet.tonapi.io',
    headers: {
      Authorization: `Bearer ${config.tonApiKey}`,
    },
  });
};

export const getTonClientV2 = (
  config: TonendpointConfig,
  current?: Network
) => {
  return new ConfigurationV2({
    basePath:
      current === Network.MAINNET
        ? 'https://tonapi.io'
        : 'https://testnet.tonapi.io',
    headers: {
      Authorization: `Bearer ${config.tonApiV2Key}`,
    },
  });
};
