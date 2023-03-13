import axios from "axios";
import { TonClient } from 'ton';
import { Configuration } from '../tonApiV1';
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


axios.interceptors.request.use(function (config) {
  if (config.headers) {
    // Broke CORS
    delete config.headers["X-Ton-Client-Version"];
  }
  return config;
}, undefined);

/**
 * @deprecated use ton api
 */
export const getOldTonClient = (config: TonendpointConfig) => {
  return new TonClient({
    endpoint: config.tonEndpoint,
    apiKey: config.tonEndpointAPIKey,
  });
};
