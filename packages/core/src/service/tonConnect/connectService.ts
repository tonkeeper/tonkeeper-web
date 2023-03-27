import { ConnectRequest } from '@tonconnect/protocol';
import { DAppManifest } from '../../entries/tonConnect';
import { Configuration } from '../../tonApiV1';

export interface TonConnectParams {
  protocolVersion: number;
  request: ConnectRequest;
  clientSessionId: string;
}

export function parseTonConnect(options: {
  url: string;
}): TonConnectParams | null {
  const TC_PREFIX = 'tc://';

  try {
    if (!options.url.startsWith(TC_PREFIX)) {
      throw new Error('must starts with ' + TC_PREFIX);
    }

    const arr = options.url.substring(TC_PREFIX.length).split('?');
    if (arr.length > 2) {
      throw new Error('multiple "?"');
    }

    const rest = arr[1];

    const result: Partial<TonConnectParams> = {};

    if (rest && rest.length) {
      const pairs = rest.split('&').map((s) => s.split('='));

      for (const pair of pairs) {
        if (pair.length !== 2) throw new Error('invalid url pair');
        const key = pair[0];
        const value = pair[1];

        if (key === 'v') {
          result.protocolVersion = Number(value);
        } else if (key === 'r') {
          result.request = JSON.parse(decodeURIComponent(value));
        }
        if (key === 'id') {
          result.clientSessionId = value;
        }
      }
    }
    return result as TonConnectParams;
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
