import { QueryKey } from '../libs/queryKey';
import { useAppSdk } from '../hooks/appSdk';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AccountConnection,
    getTonWalletConnections,
    saveAccountConnection,
    setAccountConnection
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { useAppContext } from '../hooks/appContext';
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
import { isStandardTonWallet, TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { useActiveWallet, useAccountsState, useActiveAccount, useActiveTonNetwork } from './wallet';
import { isAccountControllable } from "@tonkeeper/core/dist/entries/account";

export const useAppTonConnectConnections = () => {
    const sdk = useAppSdk();
    const wallets = useAccountsState().flatMap(a => a.allTonWallets);

    return useQuery<{ wallet: TonWalletStandard; connections: AccountConnection[] }[]>(
        [QueryKey.tonConnectConnection, wallets.map(i => i.id)],
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
    const wallet = useActiveWallet();
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

    const connection = appConnections.find(c => c.wallet.id === wallet.id)!;
    if (!connection) {
        return { data: undefined, ...rest };
    }
    return { data: connection.connections, ...rest };
};

export const useConnectTonConnectAppMutation = () => {
    const account = useActiveAccount();
    const sdk = useAppSdk();
    const client = useQueryClient();
    const { api } = useAppContext();
    const { t } = useTranslation();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const network = useActiveTonNetwork();
    const activeIsLedger = account.type === 'ledger';

    return useMutation<
        ConnectItemReply[],
        Error,
        {
            request: ConnectRequest;
            manifest: DAppManifest;
            webViewUrl?: string;
        }
    >(async ({ request, manifest, webViewUrl }) => {
        const wallet = account.activeTonWallet;
        if (!isStandardTonWallet(wallet)) {
            throw new Error('Only standard ton wallets can be connected');
        }
        const params = await getTonConnectParams(request);

        const result = [] as ConnectItemReply[];

        for (const item of request.items) {
            if (item.name === 'ton_addr') {
                result.push(toTonAddressItemReply(wallet, network));
            }
            if (item.name === 'ton_proof') {
                if (activeIsLedger) {
                    throw new Error('Ledger doesnt support ton_proof');
                }
                const signTonConnect = signTonConnectOver(sdk, account.id, t, checkTouchId);
                const timestamp = await getServerTime(api);
                const proof = tonConnectProofPayload(
                    timestamp,
                    webViewUrl ?? manifest.url,
                    wallet.rawAddress,
                    item.payload
                );
                result.push(
                    await toTonProofItemReply({
                        storage: sdk.storage,
                        account,
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
                const enable = await sdk.notifications.subscribed(wallet.rawAddress);
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
    const wallet = useActiveWallet();
    const client = useQueryClient();
    const accounts = useAccountsState().filter(isAccountControllable);

    return useMutation(async (connection: AccountConnection | 'all') => {
        if (!isStandardTonWallet(wallet)) {
            throw new Error('Only standard ton wallets can be disconnected');
        }
        let connectionsToDisconnect: AccountConnection[];
        if (sdk.targetEnv !== 'extension') {
            connectionsToDisconnect = await disconnectFromWallet(sdk.storage, connection, wallet);
        } else {
            connectionsToDisconnect = (
                await Promise.all(
                    accounts
                        .flatMap(a => a.allTonWallets)
                        .map(w => disconnectFromWallet(sdk.storage, connection, w))
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
    wallet: Pick<TonWalletStandard, 'publicKey' | 'id'>
) => {
    let connections = await getTonWalletConnections(storage, wallet);
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
