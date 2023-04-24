import queryString from 'query-string';
import { beginCell, storeStateInit } from 'ton-core';
import { TonConnectError } from '../../entries/exception';
import { Network } from '../../entries/network';
import {
  ConnectEvent,
  ConnectItem,
  ConnectItemReply,
  ConnectRequest,
  CONNECT_EVENT_ERROR_CODES,
  DAppManifest,
  DeviceInfo,
  TonAddressItemReply,
} from '../../entries/tonConnect';
import { WalletState } from '../../entries/wallet';
import { IStorage } from '../../Storage';
import { Configuration } from '../../tonApiV1';
import { walletContractFromState } from '../wallet/contractService';
import { getCurrentWallet } from '../wallet/storeService';
import {
  disconnectAccountConnection,
  getAccountConnection,
  saveAccountConnection,
  TonConnectParams,
} from './connectionService';

const TC_PREFIX = 'tc://';

export function parseTonConnect(options: {
  url: string;
}): TonConnectParams | null {
  try {
    if (!options.url.startsWith(TC_PREFIX)) {
      throw new Error('must starts with ' + TC_PREFIX);
    }

    const { query } = queryString.parseUrl(options.url);

    if (query.v !== '2') {
      throw Error('Unknown version' + options.url);
    }
    if (typeof query.id !== 'string') {
      throw Error('missing id ' + options.url);
    }
    if (typeof query.r !== 'string') {
      throw Error('missing payload ' + options.url);
    }

    const protocolVersion = parseInt(query.v);
    const request = JSON.parse(decodeURIComponent(query.r)) as ConnectRequest;
    const clientSessionId = query.id;
    //const sessionCrypto = new SessionCrypto();

    return {
      protocolVersion,
      request,
      clientSessionId,
      sessionKeyPair: undefined!,
    };
  } catch (e) {
    return null;
  }
}

export const getManifest = async (
  tonApi: Configuration,
  request: ConnectRequest
) => {
  const response = await tonApi.fetchApi!(request.manifestUrl, {
    method: 'GET',
  });

  const manifest = (await response.json()) as DAppManifest;

  const isValid =
    manifest &&
    typeof manifest.url === 'string' &&
    typeof manifest.name === 'string' &&
    typeof manifest.iconUrl === 'string';

  if (!isValid) {
    throw new Error('Manifest is not valid');
  }

  return manifest;
};

function getPlatform(): DeviceInfo['platform'] {
  const platform =
    (window.navigator as any)?.userAgentData?.platform ||
    window.navigator.platform;

  const userAgent = window.navigator.userAgent;

  const macosPlatforms = ['macOS', 'Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
  const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
  const iphonePlatforms = ['iPhone'];
  const iosPlatforms = ['iPad', 'iPod'];

  let os: DeviceInfo['platform'] | null = null;

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = 'mac';
  } else if (iphonePlatforms.indexOf(platform) !== -1) {
    os = 'iphone';
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = 'ipad';
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = 'windows';
  } else if (/Android/.test(userAgent)) {
    os = 'android';
  } else if (/Linux/.test(platform)) {
    os = 'linux';
  }

  return os!;
}

export const getDeviceInfo = (appVersion: string): DeviceInfo => {
  return {
    platform: getPlatform()!,
    appName: 'Tonkeeper',
    appVersion: appVersion,
    maxProtocolVersion: 2,
    features: [
      'SendTransaction',
      {
        name: 'SendTransaction',
        maxMessages: 4,
      },
    ],
  };
};

export const walletTonReConnect = async (options: {
  storage: IStorage;
  wallet: WalletState;
  webViewUrl: string;
}) => {
  const connections = await getAccountConnection(
    options.storage,
    options.wallet
  );

  const connection = connections.find(
    (item) => item.webViewUrl === options.webViewUrl
  );
  if (connection === null) {
    throw new TonConnectError(
      'Missing connection',
      CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR
    );
  }
};

export const tonReConnectRequest = async (
  storage: IStorage,
  webViewUrl: string
): Promise<ConnectItem[]> => {
  const wallet = await getCurrentWallet(storage);

  await walletTonReConnect({ storage, wallet, webViewUrl });

  const network = wallet.network || Network.MAINNET;
  const contract = walletContractFromState(wallet);

  const result: TonAddressItemReply = {
    name: 'ton_addr',
    address: contract.address.toString({
      urlSafe: false,
      testOnly: network !== Network.MAINNET,
    }),
    network: network,
    walletStateInit: beginCell()
      .storeWritable(storeStateInit(contract.init))
      .endCell()
      .toBoc()
      .toString('base64'),
    publicKey: wallet.publicKey,
  };

  return [result];
};

export const tonDisconnectRequest = async (options: {
  storage: IStorage;
  webViewUrl: string;
}) => {
  const wallet = await getCurrentWallet(options.storage);
  await disconnectAccountConnection({ ...options, wallet });
};

export const walletTonConnect = async (options: {
  storage: IStorage;
  wallet: WalletState;
  manifest: DAppManifest;
  params: TonConnectParams;
  replyItems: ConnectItemReply[];
  appVersion: string;
  webViewUrl: string;
}): Promise<ConnectEvent> => {
  await saveAccountConnection(options);
  return {
    id: Date.now(),
    event: 'connect',
    payload: {
      items: options.replyItems,
      device: getDeviceInfo(options.appVersion),
    },
  };
};
