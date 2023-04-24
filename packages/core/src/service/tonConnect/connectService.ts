import {
  ConnectEvent,
  ConnectItemReply,
  ConnectRequest,
  DeviceInfo,
  KeyPair,
  SessionCrypto,
} from '@tonconnect/protocol';
import queryString from 'query-string';
import { DAppManifest } from '../../entries/tonConnect';
import { WalletState } from '../../entries/wallet';
import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import { Configuration } from '../../tonApiV1';

export interface TonConnectParams {
  protocolVersion: number;
  request: ConnectRequest;
  clientSessionId: string;
  sessionCrypto: SessionCrypto;
}

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
    const sessionCrypto = new SessionCrypto();

    return {
      protocolVersion,
      request,
      clientSessionId,
      sessionCrypto,
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
    features: ['SendTransaction'],
  };
};

export interface AccountConnection {
  manifest: DAppManifest;
  sessionKeyPair: KeyPair;
  clientSessionId: string;
  webViewUrl: string;
}

export const getAccountConnection = async (
  storage: IStorage,
  wallet: WalletState
) => {
  const result = await storage.get<AccountConnection[]>(
    `${AppKey.connections}_${wallet.publicKey}_${wallet.network}`
  );
  return result ?? [];
};

export const setAccountConnection = async (
  storage: IStorage,
  wallet: WalletState,
  items: AccountConnection[]
) => {
  await storage.set(
    `${AppKey.connections}_${wallet.publicKey}_${wallet.network}`,
    items
  );
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
    throw new Error('missing connection');
  }
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
  const connections = await getAccountConnection(
    options.storage,
    options.wallet
  );

  connections.push({
    manifest: options.manifest,
    sessionKeyPair: options.params.sessionCrypto.stringifyKeypair(),
    clientSessionId: options.params.clientSessionId,
    webViewUrl: options.webViewUrl,
  });

  await setAccountConnection(options.storage, options.wallet, connections);

  return {
    id: Date.now(),
    event: 'connect',
    payload: {
      items: options.replyItems,
      device: getDeviceInfo(options.appVersion),
    },
  };
};
