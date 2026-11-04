import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import type { WalletKitTypes } from '@reown/walletkit';
import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { walletConnectService } from '@tonkeeper/core/dist/service/walletConnect/walletConnectService';
import {
    WalletConnectNetwork,
    networkOfEvmHexChainId,
    sessionNetworks
} from '@tonkeeper/core/dist/service/walletConnect/wcChains';
import {
    WalletConnectSessionMeta,
    getWalletConnectSessionMetas,
    pruneWalletConnectSessionMetas,
    setWalletConnectSessionMeta
} from '@tonkeeper/core/dist/service/walletConnect/wcSessionMeta';

import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import { useEvmInjectedConnections } from './evmInjected';
import { useActiveWalletConnectedApps } from './tonConnect';
import { useAccountsState, useActiveAccount } from './wallet';

export interface WalletConnectSessionInfo {
    topic: string;
    name: string;
    url: string;
    icon?: string;
    networks: WalletConnectNetwork[];
    meta?: WalletConnectSessionMeta;
}

export const useHasMultichainAccount = (): boolean => {
    const accounts = useAccountsState();
    return accounts.some(account => account.type === 'multichain');
};

/**
 * Boots the WalletConnect relay client once a multichain account exists,
 * so persisted sessions reconnect and incoming requests are received
 * regardless of which screen is open.
 */
export const useWalletConnectInit = () => {
    const sdk = useAppSdk();
    const enabled = useHasMultichainAccount();

    useEffect(() => {
        if (enabled) {
            walletConnectService.init(sdk.storage).catch(e => console.error(e));
        }
    }, [enabled, sdk]);
};

export const useWalletConnectSessions = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    const enabled = useHasMultichainAccount();

    useEffect(
        () =>
            walletConnectService.sessionsChanged$.subscribe(() =>
                client.invalidateQueries([QueryKey.walletConnectSessions])
            ),
        [client]
    );

    return useQuery<WalletConnectSessionInfo[]>(
        [QueryKey.walletConnectSessions],
        async () => {
            await walletConnectService.init(sdk.storage);
            const sessions = Object.values(walletConnectService.getActiveSessions());
            await pruneWalletConnectSessionMetas(
                sdk.storage,
                sessions.map(s => s.topic)
            );
            const metas = await getWalletConnectSessionMetas(sdk.storage);
            return sessions.map(session => ({
                topic: session.topic,
                name: session.peer.metadata.name,
                url: session.peer.metadata.url,
                icon: session.peer.metadata.icons[0],
                networks: sessionNetworks(session.namespaces),
                meta: metas[session.topic]
            }));
        },
        { enabled }
    );
};

/**
 * Entry point of the pairing whose proposal arrives next over the relay.
 * The proposal event doesn't echo how its pairing URI reached the app,
 * so the pair call records it here for the approval flow to persist.
 */
export const walletConnectPairSource: { current: WalletConnectSessionMeta['source'] } = {
    current: 'link'
};

export const useWalletConnectPair = () => {
    const sdk = useAppSdk();
    return useMutation<void, Error, { uri: string; source: WalletConnectSessionMeta['source'] }>(
        async ({ uri, source }) => {
            walletConnectPairSource.current = source;
            await walletConnectService.init(sdk.storage);
            await walletConnectService.pair(uri);
        }
    );
};

export const useApproveWalletConnectProposal = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<
        void,
        Error,
        {
            proposal: WalletKitTypes.SessionProposal;
            account: AccountMultichain;
            source: WalletConnectSessionMeta['source'];
        }
    >(async ({ proposal, account, source }) => {
        const session = await walletConnectService.approveProposal(proposal, account);
        await setWalletConnectSessionMeta(sdk.storage, session.topic, {
            accountId: account.id,
            connectedAt: Date.now(),
            source
        });
        await client.invalidateQueries([QueryKey.walletConnectSessions]);
    });
};

export const useRejectWalletConnectProposal = () => {
    return useMutation<void, Error, number>(proposalId =>
        walletConnectService.rejectProposal(proposalId)
    );
};

export const useDisconnectWalletConnectSession = () => {
    const client = useQueryClient();
    return useMutation<void, Error, string>(async topic => {
        await walletConnectService.disconnectSession(topic);
        await client.invalidateQueries([QueryKey.walletConnectSessions]);
    });
};

export interface MultichainConnectedApp {
    protocol: 'tonConnect' | 'walletConnect' | 'evmInjected';
    /** Session topic for WalletConnect, dApp origin otherwise. */
    key: string;
    name: string;
    url: string;
    icon?: string;
    /** Network codes the app is connected on, for chain badges. */
    chains: string[];
    connectedAt?: number;
    source?: WalletConnectSessionMeta['source'];
}

/**
 * The active account's connected dApps across every protocol: TonConnect
 * connections (TON dApps), WalletConnect sessions (EVM / TRON dApps), and
 * the extension's injected-EVM connections. WalletConnect sessions whose
 * approval metadata was lost are shown regardless of account rather than
 * silently hidden.
 */
export const useMultichainConnectedApps = () => {
    const account = useActiveAccount();
    const tonConnect = useActiveWalletConnectedApps();
    const walletConnect = useWalletConnectSessions();
    const evmInjected = useEvmInjectedConnections();

    const isLoading =
        (tonConnect.data === undefined && tonConnect.isFetching) ||
        walletConnect.isLoading ||
        evmInjected.isLoading;
    // A protocol whose store failed to read is simply missing from `data`,
    // so the flag is what tells "no apps connected" from "couldn't tell".
    const isError = tonConnect.isError || walletConnect.isError || evmInjected.isError;
    const refetch = () => {
        if (tonConnect.isError) void tonConnect.refetch();
        if (walletConnect.isError) void walletConnect.refetch();
        if (evmInjected.isError) void evmInjected.refetch();
    };

    const data = useMemo<MultichainConnectedApp[] | undefined>(() => {
        if (isLoading) return undefined;
        const tonApps: MultichainConnectedApp[] = (tonConnect.data ?? []).map(dapp => ({
            protocol: 'tonConnect',
            key: dapp.origin,
            name: dapp.name,
            url: dapp.origin,
            icon: dapp.icon,
            chains: ['ton']
        }));
        const wcApps: MultichainConnectedApp[] = (walletConnect.data ?? [])
            .filter(session => !session.meta || session.meta.accountId === account.id)
            .map(session => ({
                protocol: 'walletConnect',
                key: session.topic,
                name: session.name,
                url: session.url,
                icon: session.icon,
                chains: session.networks,
                connectedAt: session.meta?.connectedAt,
                source: session.meta?.source
            }));
        const injectedApps: MultichainConnectedApp[] = (evmInjected.data ?? [])
            .filter(connection => connection.accountId === account.id)
            .map(connection => {
                const network = networkOfEvmHexChainId(connection.chainId);
                return {
                    protocol: 'evmInjected' as const,
                    key: connection.origin,
                    name: connection.name ?? new URL(connection.origin).hostname,
                    url: connection.origin,
                    icon: connection.icon,
                    chains: network ? [network] : [],
                    connectedAt: connection.connectedAt
                };
            });
        return [...injectedApps, ...wcApps, ...tonApps];
    }, [isLoading, tonConnect.data, walletConnect.data, evmInjected.data, account.id]);

    return { data, isLoading, isError, refetch };
};
