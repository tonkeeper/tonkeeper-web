import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { subject } from '@tonkeeper/core/dist/entries/atom';
import {
    EvmInjectedConnection,
    getEvmInjectedConnections,
    removeEvmInjectedConnection
} from '@tonkeeper/core/dist/service/evmInjectedConnectionsService';

import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';

export interface EvmInjectedConnectedApp extends EvmInjectedConnection {
    origin: string;
}

/**
 * dApps connected through the extension's injected EVM provider
 * (window.ethereum / EIP-6963). The store is only written by the
 * extension background, so other shells always read an empty record.
 */
export const useEvmInjectedConnections = () => {
    const sdk = useAppSdk();
    return useQuery<EvmInjectedConnectedApp[]>([QueryKey.evmInjectedConnections], async () => {
        const all = await getEvmInjectedConnections(sdk.storage);
        return Object.entries(all).map(([origin, connection]) => ({ origin, ...connection }));
    });
};

/**
 * Origin whose injected-EVM connection the user removed from the wallet
 * UI. The extension bridges this to its background so the dApp receives
 * `accountsChanged: []`.
 */
export const evmInjectedAppManuallyDisconnected$ = subject<string>();

export const useDisconnectEvmInjectedConnection = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<void, Error, string>(async origin => {
        await removeEvmInjectedConnection(sdk.storage, origin);
        evmInjectedAppManuallyDisconnected$.next(origin);
        await client.invalidateQueries([QueryKey.evmInjectedConnections]);
    });
};
