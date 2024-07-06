import { QueryKey } from '../libs/queryKey';
import { useAppSdk } from '../hooks/appSdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AccountConnection,
    getAccountConnection,
    saveAccountConnection,
    setAccountConnection
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import {
    ConnectItemReply,
    ConnectRequest,
    DAppManifest
} from '@tonkeeper/core/dist/entries/tonConnect';
import { subject } from '../libs/atom';
import { getLastEventId } from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import { useTranslation } from '../hooks/translation';
import { useCheckTouchId } from './password';
import {
    getAppConnections,
    getTonConnectParams,
    tonConnectProofPayload,
    toTonAddressItemReply,
    toTonProofItemReply
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { signTonConnectOver } from './mnemonic';
import { getServerTime } from '@tonkeeper/core/dist/service/transfer/common';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { Network } from '@tonkeeper/core/dist/entries/network';

export const useAppTonConnectConnections = () => {
    const sdk = useAppSdk();
    const { account } = useAppContext();

    return useQuery<{ wallet: WalletState; connections: AccountConnection[] }[]>(
        [QueryKey.tonConnectConnection, account.publicKeys],
        async () => {
            return getAppConnections(sdk.storage);
        }
    );
};

export const useTonConnectLastEventId = () => {
    const sdk = useAppSdk();

    return useQuery([QueryKey.tonConnectLastEventId], async () => {
        return getLastEventId(sdk.storage);
    });
};

export const useActiveWalletTonConnectConnections = () => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    const { data: appConnections, ...rest } = useAppTonConnectConnections();
    if (!appConnections) {
        return { data: undefined, ...rest };
    }

    if (sdk.targetEnv === 'extension') {
        const connection = appConnections.flatMap(i => i.connections);
        const set: AccountConnection[] = [];
        connection.forEach(item => {
            if (set.every(i => i.webViewUrl !== item.webViewUrl)) {
                set.push(item);
            }
        });
        return { data: set, ...rest };
    }

    const connection = appConnections.find(c => c.wallet.publicKey === wallet.publicKey)!;
    if (!connection) {
        return { data: undefined, ...rest };
    }
    return { data: connection.connections, ...rest };
};

export const useConnectTonConnectAppMutation = () => {
    const wallet = useWalletContext();
    const sdk = useAppSdk();
    const client = useQueryClient();
    const { api } = useAppContext();
    const { t } = useTranslation();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    return useMutation<
        ConnectItemReply[],
        Error,
        {
            request: ConnectRequest;
            manifest: DAppManifest;
            webViewUrl?: string;
        }
    >(async ({ request, manifest, webViewUrl }) => {
        const params = await getTonConnectParams(request);

        const result = [] as ConnectItemReply[];

        for (const item of request.items) {
            if (item.name === 'ton_addr') {
                result.push(toTonAddressItemReply(wallet));
            }
            if (item.name === 'ton_proof') {
                const signTonConnect = signTonConnectOver(sdk, wallet.publicKey, t, checkTouchId);
                const timestamp = await getServerTime(api);
                const proof = tonConnectProofPayload(
                    timestamp,
                    webViewUrl ?? manifest.url,
                    wallet.active.rawAddress,
                    item.payload
                );
                result.push(
                    await toTonProofItemReply({
                        storage: sdk.storage,
                        wallet,
                        signTonConnect,
                        proof
                    })
                );
            }
        }

        await saveAccountConnection({
            storage: sdk.storage,
            wallet,
            manifest,
            params,
            webViewUrl
        });

        if (sdk.notifications) {
            try {
                const enable = await sdk.notifications.subscribed(wallet.active.rawAddress);
                if (enable) {
                    await sdk.notifications.subscribeTonConnect(
                        params.clientSessionId,
                        new URL(manifest.url).host
                    );
                }
            } catch (e) {
                if (e instanceof Error) sdk.topMessage(e.message);
            }
        }

        await client.invalidateQueries([QueryKey.tonConnectConnection]);
        await client.invalidateQueries([QueryKey.tonConnectLastEventId]);

        return result;
    });
};

export const tonConnectAppManuallyDisconnected$ = subject<
    AccountConnection | AccountConnection[]
>();

export const useDisconnectTonConnectApp = (options?: { skipEmit?: boolean }) => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const { account } = useAppContext();

    return useMutation(async (connection: AccountConnection | 'all') => {
        let connectionsToDisconnect: AccountConnection[];
        if (sdk.targetEnv !== 'extension') {
            connectionsToDisconnect = await disconnectFromWallet(sdk.storage, connection, wallet);
        } else {
            connectionsToDisconnect = (
                await Promise.all(
                    account.publicKeys.map(publicKey =>
                        disconnectFromWallet(sdk.storage, connection, {
                            publicKey,
                            network: Network.MAINNET
                        })
                    )
                )
            ).flat();
        }

        if (!options?.skipEmit) {
            tonConnectAppManuallyDisconnected$.next(connectionsToDisconnect);
        }

        if (sdk.notifications) {
            await Promise.all(
                connectionsToDisconnect.map(c =>
                    sdk.notifications?.unsubscribeTonConnect(c.clientSessionId)
                )
            );
        }

        await client.invalidateQueries([QueryKey.tonConnectConnection]);
    });
};

const disconnectFromWallet = async (
    storage: IStorage,
    connection: AccountConnection | 'all',
    wallet: Pick<WalletState, 'publicKey' | 'network'>
) => {
    let connections = await getAccountConnection(storage, wallet);
    const connectionsToDisconnect = connection === 'all' ? connections : [connection];

    connections =
        connection === 'all'
            ? []
            : connections.filter(item =>
                  connectionsToDisconnect.every(c => c.clientSessionId !== item.clientSessionId)
              );

    await setAccountConnection(storage, wallet, connections);

    return connectionsToDisconnect;
};
