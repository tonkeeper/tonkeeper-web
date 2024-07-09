import { Network } from '../../entries/network';
import { ConnectRequest, DAppManifest, KeyPair } from '../../entries/tonConnect';
import { StandardTonWalletState } from '../../entries/wallet';
import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';

export interface TonConnectParams {
    protocolVersion: number;
    request: ConnectRequest;
    clientSessionId: string;
    sessionKeyPair: KeyPair;
}

export interface AccountConnection {
    manifest: DAppManifest;
    sessionKeyPair: KeyPair;
    clientSessionId: string;
    webViewUrl?: string;
}

export const getAccountConnection = async (
    storage: IStorage,
    wallet: Pick<StandardTonWalletState, 'id' | 'network' | 'publicKey'>
) => {
    let result = await storage.get<AccountConnection[]>(
        `${AppKey.CONNECTIONS}_${wallet.id}_${wallet.network}`
    );

    if (!result) {
        result = await migrateAccountConnections(storage, wallet);
        await setAccountConnection(storage, wallet, result);
    }

    return result;
};

export const setAccountConnection = async (
    storage: IStorage,
    wallet: Pick<StandardTonWalletState, 'id' | 'network'>,
    items: AccountConnection[]
) => {
    await storage.set(`${AppKey.CONNECTIONS}_${wallet.id}_${wallet.network}`, items);
};

export const saveAccountConnection = async (options: {
    storage: IStorage;
    wallet: StandardTonWalletState;
    manifest: DAppManifest;
    params: TonConnectParams;
    webViewUrl?: string;
}): Promise<void> => {
    let connections = await getAccountConnection(options.storage, options.wallet);

    const old = connections.find(item => item.manifest.url === options.manifest.url);
    if (old) {
        connections = connections.filter(item => item !== old);
    }

    connections.unshift({
        manifest: options.manifest,
        sessionKeyPair: options.params.sessionKeyPair,
        clientSessionId: options.params.clientSessionId,
        webViewUrl: options.webViewUrl
    });

    await setAccountConnection(options.storage, options.wallet, connections);
};

/**
 * Disconnect by url, for js bridge
 */
export const disconnectAccountConnection = async (options: {
    storage: IStorage;
    wallet: StandardTonWalletState;
    webViewUrl: string;
}) => {
    let connections = await getAccountConnection(options.storage, options.wallet);

    connections = connections.filter(item => item.webViewUrl !== options.webViewUrl);

    await setAccountConnection(options.storage, options.wallet, connections);
};

/**
 * Disconnect by session id, for http bridge
 */
export const disconnectAppConnection = async (options: {
    storage: IStorage;
    wallet: StandardTonWalletState;
    clientSessionId: string;
}) => {
    let connections = await getAccountConnection(options.storage, options.wallet);

    connections = connections.filter(item => item.clientSessionId !== options.clientSessionId);

    await setAccountConnection(options.storage, options.wallet, connections);
};

async function migrateAccountConnections(
    storage: IStorage,
    wallet: Pick<StandardTonWalletState, 'network' | 'publicKey'>
) {
    const oldConnections = await storage.get<AccountConnection[]>(
        `${AppKey.CONNECTIONS}_${wallet.publicKey}_${wallet.network ?? Network.MAINNET}`
    );

    return oldConnections ?? [];
}
