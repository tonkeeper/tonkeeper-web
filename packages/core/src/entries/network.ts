import { Configuration } from '../tonApi';
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
        ? 'https://tonapi.io'
        : 'https://testnet.tonapi.io',
    headers: {
      Authorization: `Bearer ${config.tonApiKey}`,
    },
  });
};
