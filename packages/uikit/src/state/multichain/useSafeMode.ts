import { useEffect } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';

import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { Account } from '@tonkeeper/core/dist/entries/account';
import {
    SAFE_MODE_AUTO_REENABLE_MS,
    SafeModeState,
    SafeModeStoredState,
    getSafeModeStoredState,
    resolveSafeModeState,
    setSafeModeStoredState
} from '@tonkeeper/core/dist/service/safeModeService';

import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';

type SafeModeStateWithExpiry = SafeModeState & {
    autoReenableAtMs?: number;
};

const accountSafeModeQuery = (sdk: IAppSdk, account: Account, serverDefault: boolean) => ({
    queryKey: [QueryKey.safeMode, account.id, serverDefault],
    queryFn: async (): Promise<SafeModeStateWithExpiry> => {
        const stored = await getSafeModeStoredState(sdk.storage, account.id);
        const state = resolveSafeModeState(stored, serverDefault, Date.now());
        return stored?.type === 'disabled' && state.temporarilyDisabled
            ? {
                  ...state,
                  autoReenableAtMs: stored.disabledAtMs + SAFE_MODE_AUTO_REENABLE_MS
              }
            : state;
    }
});

/**
 * Safe-mode state of one account: the stored per-account choice resolved
 * against the server's `safe_mode_enabled` default and the 24-hour
 * auto-re-enable window. Asset queries key on `data.enabled` and gate on
 * `data` being loaded, so a toggle flip re-fetches them with the matching
 * `verified_only`.
 */
export const useAccountSafeModeState = (account: Account) => {
    const sdk = useAppSdk();
    const { mainnetConfig } = useAppContext();
    const serverDefault = mainnetConfig.flags?.safe_mode_enabled ?? false;

    const query = useQuery<SafeModeStateWithExpiry>({
        ...accountSafeModeQuery(sdk, account, serverDefault),
        keepPreviousData: true
    });

    const autoReenableAtMs = query.data?.autoReenableAtMs;
    const { refetch } = query;
    useEffect(() => {
        if (autoReenableAtMs === undefined) return;

        // Add one millisecond so an early timer tick cannot resolve the
        // strict expiry comparison back to "temporarily disabled".
        const delay = Math.max(autoReenableAtMs - Date.now() + 1, 1);
        const timeout = setTimeout(() => void refetch(), delay);
        return () => clearTimeout(timeout);
    }, [autoReenableAtMs, refetch]);

    return query;
};

/**
 * Whether safe mode is on for each of `accounts`, in order — `undefined`
 * while an account's state is still loading. Shares its cache entries with
 * `useAccountSafeModeState`, so a list never re-reads storage for an
 * account whose state a row already resolved.
 */
export const useAccountsSafeModeEnabled = (accounts: Account[]): (boolean | undefined)[] => {
    const sdk = useAppSdk();
    const { mainnetConfig } = useAppContext();
    const serverDefault = mainnetConfig.flags?.safe_mode_enabled ?? false;

    const results = useQueries({
        queries: accounts.map(account => ({
            ...accountSafeModeQuery(sdk, account, serverDefault),
            keepPreviousData: true
        }))
    });
    return results.map(result => result.data?.enabled);
};

export const useSafeModeState = () => {
    const account = useActiveAccount();
    return useAccountSafeModeState(account);
};

export const useMutateSafeMode = () => {
    const sdk = useAppSdk();
    const account = useActiveAccount();
    const client = useQueryClient();

    return useMutation<void, Error, SafeModeStoredState>(async state => {
        await setSafeModeStoredState(sdk.storage, account.id, state);
        await client.invalidateQueries([QueryKey.safeMode]);
    });
};
