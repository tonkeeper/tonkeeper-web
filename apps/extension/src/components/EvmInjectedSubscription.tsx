import { useEffect } from 'react';
import browser from 'webextension-polyfill';
import { useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { evmInjectedAppManuallyDisconnected$ } from '@tonkeeper/uikit/dist/state/evmInjected';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { sendBackground } from '../event';

/**
 * Keeps the popup in sync with the background's injected-EVM connection
 * store: refetches the connected-apps list when the background writes it
 * (connect, chain switch, dApp-side revoke), and bridges wallet-side
 * disconnects to the background so the dApp receives `accountsChanged: []`.
 * The popup removes the stored connection itself before emitting.
 */
export const EvmInjectedSubscription = () => {
    const client = useQueryClient();

    useEffect(() => {
        const onStorageChanged = (changes: Record<string, unknown>, areaName: string): void => {
            if (areaName === 'local' && AppKey.EVM_INJECTED_CONNECTIONS in changes) {
                client.invalidateQueries([QueryKey.evmInjectedConnections]);
            }
        };
        browser.storage.onChanged.addListener(onStorageChanged);
        return () => browser.storage.onChanged.removeListener(onStorageChanged);
    }, [client]);

    useEffect(() => {
        return evmInjectedAppManuallyDisconnected$.subscribe(origin => {
            sendBackground.message('evmDisconnect', origin);
        });
    }, []);

    return null;
};
