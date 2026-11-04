import { useCallback } from 'react';

import {
    WalletColor,
    defaultWalletColor,
    walletColorById
} from '@tonkeeper/core/dist/entries/walletColor';

import { useGlobalPreferences, useMutateGlobalPreferences } from './global-preferences';

/**
 * Resolve avatar colours for accounts. Returns a lookup rather than a
 * single colour so a list of wallets reads the preferences once instead of
 * per row.
 */
export const useWalletColorResolver = (): ((accountId: string) => WalletColor) => {
    const { walletColors } = useGlobalPreferences();
    return useCallback(
        accountId => walletColorById(walletColors[accountId]) ?? defaultWalletColor(accountId),
        [walletColors]
    );
};

export const useWalletColor = (accountId: string): WalletColor =>
    useWalletColorResolver()(accountId);

export const useMutateWalletColor = () => {
    const { walletColors } = useGlobalPreferences();
    const { mutateAsync, ...rest } = useMutateGlobalPreferences();

    const setWalletColor = useCallback(
        (accountId: string, colorId: string) =>
            mutateAsync({ walletColors: { ...walletColors, [accountId]: colorId } }),
        [mutateAsync, walletColors]
    );

    return { ...rest, setWalletColor };
};
