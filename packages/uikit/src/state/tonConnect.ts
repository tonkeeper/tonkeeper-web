import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    ConnectItemReply,
    ConnectRequest,
    DAppManifest
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    createTonProofItem,
    getAppConnections,
    getTonConnectParams,
    tonConnectProofPayload,
    toTonAddressItemReply,
    toTonProofItemReply
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import {
    AccountConnection,
    getTonWalletConnections,
    saveAccountConnection,
    setAccountConnection
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { getLastEventId } from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { subject } from '../libs/atom';
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
import { useCheckTouchId } from './password';
import { useAccountsState, useAccountsStateQuery, useActiveWallet } from './wallet';
import { TxConfirmationCustomError } from '../libs/errors/TxConfirmationCustomError';
import { getServerTime } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { getContextApiByNetwork } from '@tonkeeper/core/dist/service/walletService';
import { useAppContext } from '../hooks/appContext';

export const useAppTonConnectConnections = () => {
    const sdk = useAppSdk();

    const { data } = useAccountsStateQuery();

    const wallets = data?.flatMap(a => a.allTonWallets);

    return useQuery<{ wallet: TonContract; connections: AccountConnection[] }[]>(
        [QueryKey.tonConnectConnection, wallets?.map(i => i.id)],
        async () => {
            return getAppConnections(sdk.storage);
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
    const appContext = useAppContext();
    const sdk = useAppSdk();
    const client = useQueryClient();
    const { t } = useTranslation();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    return useMutation<
        ConnectItemReply[],
        Error,
        {
            request: ConnectRequest;
            manifest: DAppManifest;
            webViewUrl?: string;
            account: Account;
            walletId: WalletId;
        }
    >(async ({ request, manifest, webViewUrl, account, walletId }) => {
        const selectedIsLedger = account.type === 'ledger';
        const network = getNetworkByAccount(account);
        const api = getContextApiByNetwork(appContext, network);

        const wallet = account.getTonWallet(walletId);
        if (!wallet) {
            throw new Error('Wallet not found');
        }

        const params = await getTonConnectParams(request);

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
                    webViewUrl ?? manifest.url,
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
                        t,
                        checkTouchId
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
    const accounts = useAccountsState().filter(isAccountTonWalletStandard);

    return useMutation(async (connection: AccountConnection | 'all') => {
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
                    sdk.notifications
                        ?.unsubscribeTonConnect(c.clientSessionId)
                        .catch(e => console.warn(e))
                )
            );
        }

        await client.invalidateQueries([QueryKey.tonConnectConnection]);
    });
};

const disconnectFromWallet = async (
    storage: IStorage,
    connection: AccountConnection | 'all',
    wallet: {
        id: string;
        publicKey?: string;
    }
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
