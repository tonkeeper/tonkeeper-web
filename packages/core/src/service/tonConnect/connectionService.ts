import { ConnectRequest, DAppManifest, KeyPair } from '../../entries/tonConnect';
import { TonWalletStandard } from '../../entries/wallet';
import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import { getDevSettings } from '../devStorage';

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

export const getTonWalletConnections = async (
    storage: IStorage,
    wallet: Pick<TonWalletStandard, 'id' | 'publicKey'>
) => {
    const network = (await getDevSettings(storage)).tonNetwork;

    let result = await storage.get<AccountConnection[]>(
        `${AppKey.CONNECTIONS}_${wallet.id}_${network}`
    );

    if (!result) {
        result = await migrateAccountConnections(storage, wallet);
        await setAccountConnection(storage, wallet, result);
    }

    return result;
};

export const setAccountConnection = async (
    storage: IStorage,
    wallet: Pick<TonWalletStandard, 'id'>,
    items: AccountConnection[]
) => {
    const network = (await getDevSettings(storage)).tonNetwork;

    await storage.set(`${AppKey.CONNECTIONS}_${wallet.id}_${network}`, items);
};

export const saveAccountConnection = async (options: {
    storage: IStorage;
    wallet: TonWalletStandard;
    manifest: DAppManifest;
    params: TonConnectParams;
    webViewUrl?: string;
}): Promise<void> => {
    let connections = await getTonWalletConnections(options.storage, options.wallet);

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
    wallet: TonWalletStandard;
    webViewUrl: string;
}) => {
    let connections = await getTonWalletConnections(options.storage, options.wallet);

    connections = connections.filter(item => item.webViewUrl !== options.webViewUrl);

    await setAccountConnection(options.storage, options.wallet, connections);
};

/**
 * Disconnect by session id, for http bridge
 */
export const disconnectAppConnection = async (options: {
    storage: IStorage;
    wallet: Pick<TonWalletStandard, 'id' | 'publicKey'>;
    clientSessionId: string;
}) => {
    let connections = await getTonWalletConnections(options.storage, options.wallet);

    connections = connections.filter(item => item.clientSessionId !== options.clientSessionId);

    await setAccountConnection(options.storage, options.wallet, connections);
};

async function migrateAccountConnections(
    storage: IStorage,
    wallet: Pick<TonWalletStandard, 'publicKey'>
) {
    const network = (await getDevSettings(storage)).tonNetwork;
    const oldConnections = await storage.get<AccountConnection[]>(
        `${AppKey.CONNECTIONS}_${wallet.publicKey}_${network}`
    );

    return oldConnections ?? [];
}
