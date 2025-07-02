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
    getInjectedDappConnection,
    originFromUrl,
    tonConnectProofPayload,
    toTonAddressItemReply,
    toTonProofItemReply
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import {
    AccountConnection,
    AccountConnectionHttp,
    AccountConnectionInjected,
    getTonWalletConnections,
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
import { Account, getNetworkByAccount } from '@tonkeeper/core/dist/entries/account';
import { useAccountsState, useAccountsStateQuery, useActiveWallet } from './wallet';
import { TxConfirmationCustomError } from '../libs/errors/TxConfirmationCustomError';
import { getServerTime } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { getContextApiByNetwork } from '@tonkeeper/core/dist/service/walletService';
import { useAppContext } from '../hooks/appContext';
import { subject } from '@tonkeeper/core/dist/entries/atom';
import { useCallback, useMemo } from 'react';

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

export type ConnectedDApp = {
    origin: string;
    name: string;
    icon: string;
};

export const useActiveWalletConnectedApps = () => {
    const sdk = useAppSdk();
    const wallet = useActiveWallet();
    const { data: appConnections, ...rest } = useAppTonConnectConnections();
    if (!appConnections) {
        return { data: undefined, ...rest };
    }

    let connections: (AccountConnectionInjected | AccountConnectionHttp)[] = [];
    if (sdk.targetEnv === 'extension') {
        connections = appConnections.map(i => i.connections).flat();
    } else {
        const record = appConnections.find(c => c.wallet.id === wallet.id)!;
        if (!record) {
            return { data: [], ...rest };
        }

        connections = record.connections;
    }

    const dapps: ConnectedDApp[] = [];
    connections.forEach(connection => {
        const origin = getConnectionDappOrigin(connection);
        if (!origin) {
            return;
        }
        if (dapps.every(d => !eqOrigins(d.origin, origin))) {
            dapps.push({
                origin,
                name: connection.manifest.name,
                icon: connection.manifest.iconUrl
            });
        }
    });

    return { data: dapps, ...rest };
};

export const useInjectedDappConnectionByOrigin = (origin: string | undefined) => {
    const query = useAppTonConnectConnections();

    return useMemo(() => {
        if (!query.data) {
            return query;
        } else {
            const data = origin ? getInjectedDappConnection(query.data, origin) : undefined;
            return { ...query, data };
        }
    }, [query.data, origin]);
};

export const useGetTonConnectConnectResponse = () => {
    const appContext = useAppContext();
    const sdk = useAppSdk();
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
        }
    >(async ({ request, manifest, account, walletId, webViewOrigin }) => {
        const selectedIsLedger = account.type === 'ledger';
        const network = getNetworkByAccount(account);
        const api = getContextApiByNetwork(appContext, network);

        const wallet = account.getTonWallet(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

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

        return result;
    });
};

export const tonConnectAppManuallyDisconnected$ = subject<
    AccountConnection | AccountConnection[]
>();

export const useDisconnectTonConnectConnection = (options?: { skipEmit?: boolean }) => {
    const { mutateAsync } = useDisconnectTonConnectAppFromActiveWallet(options);
    return useCallback(
        (app: { id: string }) => mutateAsync({ connectionId: app.id }),
        [mutateAsync]
    );
};

export const useDisconnectTonConnectAppFromActiveWallet = (options?: { skipEmit?: boolean }) => {
    const sdk = useAppSdk();
    const wallet = useActiveWallet();
    const client = useQueryClient();

    return useMutation(
        async (
            dapp:
                | { origin: string; connectionType?: AccountConnection['type'] }
                | 'all'
                | { connectionId: string }
        ) => {
            const connectionsToDisconnect: AccountConnection[] = await disconnectDappFromWallet(
                sdk.storage,
                dapp,
                wallet
            );

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
        }
    );
};

export const useDisconnectInjectedTonConnectAppFromAllWallets = (options?: {
    skipEmit?: boolean;
}) => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const wallets = useAccountsState().flatMap(a => a.allTonWallets);

    return useMutation(async (dapp: { origin: string }) => {
        const connectionsToDisconnect = (
            await Promise.all(
                wallets.map(w =>
                    disconnectDappFromWallet(
                        sdk.storage,
                        { origin: dapp.origin, connectionType: 'injected' },
                        w
                    )
                )
            )
        ).flat();

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

const disconnectDappFromWallet = async (
    storage: IStorage,
    dapp:
        | { origin: string; connectionType?: AccountConnection['type'] }
        | 'all'
        | { connectionId: string },
    wallet: {
        id: string;
        publicKey?: string;
    }
) => {
    let connections = await getTonWalletConnections(storage, wallet);
    const connectionsToDisconnect =
        dapp === 'all'
            ? connections
            : connections.filter(c => {
                  if ('origin' in dapp) {
                      if (dapp.connectionType !== undefined && dapp.connectionType !== c.type) {
                          return false;
                      }

                      const origin = getConnectionDappOrigin(c);
                      return !origin || eqOrigins(origin, dapp.origin);
                  } else {
                      return c.id === dapp.connectionId;
                  }
              });

    connections =
        dapp === 'all'
            ? []
            : connections.filter(item => connectionsToDisconnect.every(c => c.id !== item.id));

    await setAccountConnection(storage, wallet, connections);

    return connectionsToDisconnect;
};

function getConnectionDappOrigin(connection: AccountConnection) {
    return connection.type === 'injected'
        ? connection.webViewOrigin
        : originFromUrl(connection.manifest.url);
}
