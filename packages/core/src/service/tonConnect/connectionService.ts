import { ConnectRequest, DAppManifest, KeyPair } from '../../entries/tonConnect';
import { TonContract, TonWalletStandard } from '../../entries/wallet';
import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import { getDevSettings } from '../devStorage';
import { assertUnreachable } from '../../utils/types';
import { eqOrigins, originFromUrl } from './connectService';

export interface TonConnectHttpConnectionParams {
    type: 'http';
    protocolVersion: number;
    request: ConnectRequest;
    clientSessionId: string;
    sessionKeyPair: KeyPair;
    appName: string;
}

export interface TonConnectInjectedConnectionParams {
    type: 'injected';
    protocolVersion: number;
    request: ConnectRequest;
    appName: string;
    webViewOrigin: string;
}

export type TonConnectConnectionParams =
    | TonConnectHttpConnectionParams
    | TonConnectInjectedConnectionParams;

/**
 * @deprecated
 */
export interface DeprecatedAccountConnection {
    manifest: DAppManifest;
    sessionKeyPair: KeyPair;
    clientSessionId: string;
    webViewUrl?: string;
}

export interface AccountConnectionInjected {
    id: string; // manifest.url
    type: 'injected';
    manifest: DAppManifest;
    webViewOrigin: string;

    /**
     * used to find last created connection
     */
    creationTimestamp: number;
}

export interface AccountConnectionHttp {
    id: string; // manifest.url
    type: 'http';
    manifest: DAppManifest;
    sessionKeyPair: KeyPair;
    clientSessionId: string;
}

export function isAccountConnectionInjected(
    item: AccountConnection
): item is AccountConnectionInjected {
    return item.type === 'injected';
}

export function isAccountConnectionHttp(item: AccountConnection): item is AccountConnectionHttp {
    return item.type === 'http';
}

export type AccountConnection = AccountConnectionInjected | AccountConnectionHttp;

export const getTonWalletConnections = async (
    storage: IStorage,
    wallet: {
        id: string;
        publicKey?: string;
    }
): Promise<AccountConnection[]> => {
    const network = (await getDevSettings(storage)).tonNetwork;

    let result = await storage.get<(DeprecatedAccountConnection | AccountConnection)[]>(
        `${AppKey.CONNECTIONS}_${wallet.id}_${network}`
    );

    if (!result) {
        const publicKey = wallet.publicKey;
        if (publicKey !== undefined) {
            result = await migrateAccountConnectionsStorageKey(storage, { publicKey });
        }
        await setAccountConnection(storage, wallet, mapDeprecatedAccountConnections(result ?? []));
    }

    return mapDeprecatedAccountConnections(result ?? []);
};

export const setAccountConnection = async (
    storage: IStorage,
    wallet: Pick<TonWalletStandard, 'id'>,
    items: AccountConnection[]
) => {
    const network = (await getDevSettings(storage)).tonNetwork;

    await storage.set(`${AppKey.CONNECTIONS}_${wallet.id}_${network}`, items);
};

/**
 * Save new account connection. In case of duplicate connection, the old one will be replaced
 * @param options
 */
export const saveAccountConnection = async (options: {
    storage: IStorage;
    wallet: TonContract;
    manifest: DAppManifest;
    params:
        | Pick<TonConnectHttpConnectionParams, 'type' | 'sessionKeyPair' | 'clientSessionId'>
        | Pick<TonConnectInjectedConnectionParams, 'type' | 'webViewOrigin'>;
}): Promise<void> => {
    let connections = await getTonWalletConnections(options.storage, options.wallet);

    /**
     * Remove duplicates connections
     */
    const params = options.params;
    if (params.type === 'injected') {
        connections = connections.filter(item => {
            if (item.type !== 'injected') {
                return true;
            }

            return item.webViewOrigin !== params.webViewOrigin;
        });
    } else {
        connections = connections.filter(item => {
            if (item.type !== 'http') {
                return true;
            }

            return item.manifest.url === options.manifest.url;
        });
    }

    if (options.params.type === 'injected') {
        if (!eqOrigins(options.params.webViewOrigin, originFromUrl(options.manifest.url))) {
            throw new Error('WebView origin mismatch');
        }

        connections.unshift({
            id: options.manifest.url,
            manifest: options.manifest,
            type: options.params.type,
            webViewOrigin: options.params.webViewOrigin,
            creationTimestamp: Date.now()
        });
    } else if (options.params.type === 'http') {
        connections.unshift({
            id: options.manifest.url,
            manifest: options.manifest,
            type: options.params.type,
            sessionKeyPair: options.params.sessionKeyPair,
            clientSessionId: options.params.clientSessionId
        });
    } else {
        assertUnreachable(options.params);
    }

    await setAccountConnection(options.storage, options.wallet, connections);
};

/**
 * Disconnect by url, for js bridge
 */
export const disconnectInjectedAccountConnection = async (options: {
    storage: IStorage;
    wallet: TonContract;
    webViewUrl: string;
}) => {
    let connections = await getTonWalletConnections(options.storage, options.wallet);

    connections = connections.filter(
        item => item.type === 'injected' && !eqOrigins(item.webViewOrigin, options.webViewUrl)
    );

    await setAccountConnection(options.storage, options.wallet, connections);
};

/**
 * Disconnect by session id, for http bridge
 */
export const disconnectHttpAccountConnection = async (options: {
    storage: IStorage;
    wallet: Pick<TonWalletStandard, 'id' | 'publicKey'>;
    clientSessionId: string;
}) => {
    let connections = await getTonWalletConnections(options.storage, options.wallet);

    connections = connections.filter(
        item => item.type === 'http' && item.clientSessionId !== options.clientSessionId
    );

    await setAccountConnection(options.storage, options.wallet, connections);
};

async function migrateAccountConnectionsStorageKey(
    storage: IStorage,
    wallet: Pick<TonWalletStandard, 'publicKey'>
) {
    const network = (await getDevSettings(storage)).tonNetwork;
    const oldConnections = await storage.get<(DeprecatedAccountConnection | AccountConnection)[]>(
        `${AppKey.CONNECTIONS}_${wallet.publicKey}_${network}`
    );

    return oldConnections ?? [];
}

function mapDeprecatedAccountConnections(
    connections: (DeprecatedAccountConnection | AccountConnection)[]
): AccountConnection[] {
    return connections.map(item => {
        if ('type' in item) {
            return item;
        }

        if (item.webViewUrl) {
            return {
                id: item.manifest.url,
                type: 'injected',
                manifest: item.manifest,
                webViewOrigin: item.webViewUrl,
                creationTimestamp: Date.now()
            };
        } else {
            return {
                id: item.manifest.url,
                type: 'http',
                manifest: item.manifest,
                sessionKeyPair: item.sessionKeyPair,
                clientSessionId: item.clientSessionId
            };
        }
    });
}
