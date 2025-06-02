import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ConnectItemReply,
    ConnectRequest,
    DAppManifest
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    createTonProofItem,
    eqOrigins,
    getAppConnections,
    getTonConnectParams,
    tonConnectProofPayload,
    toTonAddressItemReply,
    toTonProofItemReply
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import {
    AccountConnection,
    AccountConnectionHttp,
    AccountConnectionInjected,
    getTonWalletConnections,
    saveAccountConnection,
    setAccountConnection
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { getLastEventId } from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { QueryKey } from '../libs/queryKey';
import { getLedgerTonProofSigner, signTonConnectOver } from './mnemonic';
import {
    isStandardTonWallet,
    TonContract,
    WalletId,
    WalletVersion
} from '@tonkeeper/core/dist/entries/wallet';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import {
    Account,
    getNetworkByAccount,
    isAccountTonWalletStandard
} from '@tonkeeper/core/dist/entries/account';
import { useAccountsState, useAccountsStateQuery, useActiveWallet } from './wallet';
import { TxConfirmationCustomError } from '../libs/errors/TxConfirmationCustomError';
import { getServerTime } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { getContextApiByNetwork } from '@tonkeeper/core/dist/service/walletService';
import { useAppContext } from '../hooks/appContext';
import { subject } from '@tonkeeper/core/dist/entries/atom';

export const useAppTonConnectConnections = <T extends AccountConnection['type']>(
    filterType?: T
) => {
    const sdk = useAppSdk();

    const { data } = useAccountsStateQuery();

    const wallets = data?.flatMap(a => a.allTonWallets);

    return useQuery<
        {
            wallet: TonContract;
            connections: T extends undefined
                ? AccountConnection
                : T extends 'injected'
                ? AccountConnectionInjected[]
                : AccountConnectionHttp[];
        }[]
    >(
        [QueryKey.tonConnectConnection, wallets?.map(i => i.id), filterType],
        () => {
            return getAppConnections(sdk.storage, filterType) as Promise<
                {
                    wallet: TonContract;
                    connections: T extends undefined
                        ? AccountConnection
                        : T extends 'injected'
                        ? AccountConnectionInjected[]
                        : AccountConnectionHttp[];
                }[]
            >;
        },
        { enabled: wallets !== undefined }
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
        const connection = appConnections.map(i => i.connections).flat();
        const set: AccountConnectionInjected[] = [];
        connection.forEach(item => {
            if (
                item.type === 'injected' &&
                set.every(i => !eqOrigins(i.webViewOrigin, item.webViewOrigin))
            ) {
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
    const appContext = useAppContext();
    const sdk = useAppSdk();
    const client = useQueryClient();
    const { t } = useTranslation();

    return useMutation<
        ConnectItemReply[],
        Error,
        {
            request: ConnectRequest;
            manifest: DAppManifest;
            webViewOrigin: string | null;
            account: Account;
            walletId: WalletId;
            appName: string;
        }
    >(async ({ request, manifest, account, walletId, appName, webViewOrigin }) => {
        const selectedIsLedger = account.type === 'ledger';
        const network = getNetworkByAccount(account);
        const api = getContextApiByNetwork(appContext, network);

        const wallet = account.getTonWallet(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const params = await getTonConnectParams(request, appName, webViewOrigin);

        const result = [] as ConnectItemReply[];

        for (const item of request.items) {
            if (item.name === 'ton_addr') {
                result.push(toTonAddressItemReply(wallet, network));
            }
            if (item.name === 'ton_proof') {
                if (!isStandardTonWallet(wallet)) {
                    throw new TxConfirmationCustomError(
                        "Current wallet doesn't support connection to the service"
                    );
                }

                const proof = tonConnectProofPayload(
                    await getServerTime(api),
                    webViewOrigin ?? manifest.url,
                    wallet.rawAddress,
                    item.payload
                );

                if (selectedIsLedger) {
                    const ledgerTonProofSigner = await getLedgerTonProofSigner(sdk, account.id, {
                        walletId: wallet.id
                    });

                    if (
                        wallet.version !== WalletVersion.V3R2 &&
                        wallet.version !== WalletVersion.V4R2
                    ) {
                        throw new TxConfirmationCustomError(
                            "Current wallet doesn't support connection to the service"
                        );
                    }

                    const { signature } = await ledgerTonProofSigner({
                        domain: proof.domain,
                        timestamp: proof.timestamp,
                        payload: Buffer.from(proof.payload),
                        walletVersion: wallet.version === WalletVersion.V3R2 ? 'v3r2' : 'v4'
                    });

                    result.push({ name: 'ton_proof', proof: createTonProofItem(signature, proof) });
                } else {
                    const signTonConnect = signTonConnectOver({
                        sdk,
                        accountId: account.id,
                        wallet,
                        t
                    });
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
        }

        await saveAccountConnection({
            storage: sdk.storage,
            wallet,
            manifest,
            params
        });

        /**
         * subscribe to notifications for http-bridge connections
         */
        if (sdk.notifications && params.type === 'http') {
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
    const accounts = useAccountsState().filter(isAccountTonWalletStandard);

    return useMutation(async (connection: { id: string } | 'all') => {
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
                connectionsToDisconnect.map(c => {
                    if (c.type === 'http') {
                        sdk.notifications
                            ?.unsubscribeTonConnect(c.clientSessionId)
                            .catch(e => console.warn(e));
                    }
                })
            );
        }

        await client.invalidateQueries([QueryKey.tonConnectConnection]);
    });
};

const disconnectFromWallet = async (
    storage: IStorage,
    connection: { id: string } | 'all',
    wallet: {
        id: string;
        publicKey?: string;
    }
) => {
    let connections = await getTonWalletConnections(storage, wallet);
    const connectionsToDisconnect =
        connection === 'all' ? connections : connections.filter(c => c.id === connection.id);

    connections =
        connection === 'all'
            ? []
            : connections.filter(item => connectionsToDisconnect.every(c => c.id !== item.id));

    await setAccountConnection(storage, wallet, connections);

    return connectionsToDisconnect;
};
