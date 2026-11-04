import { useCallback, useEffect, useRef } from 'react';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { getTonClientV2 } from '@tonkeeper/core/dist/entries/network';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { WalletApi } from '@tonkeeper/core/dist/tonApiV2';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useAccountsStateQuery } from './accounts';

export const useSyncPubkeysBulk = () => {
    const { data: accounts = [] } = useAccountsStateQuery();
    const sdk = useAppSdk();
    const { mainnetConfig } = useAppContext();

    return useCallback(
        async (extraAccounts: Account[] = []) => {
            const allAccounts = [...accounts, ...extraAccounts];
            const uniqueAccounts = allAccounts.filter(
                (acc, idx, arr) => arr.findIndex(a => a.id === acc.id) === idx
            );

            const pubkeys = uniqueAccounts
                .filter(acc => acc.type !== 'watch-only')
                .flatMap(acc => acc.allTonWallets)
                .filter(isStandardTonWallet)
                .map(w => w.publicKey)
                .filter((pk, idx, arr) => arr.indexOf(pk) === idx);

            if (pubkeys.length === 0) return;

            const persistentUserId = await sdk.userIdentity.getPersistentUserId();

            // Fire-and-forget for analytics purposes only. The generated
            // client's response decoder crashes when the backend returns
            // a `Wallets` payload without a `wallets` array (a no-result
            // shape), so swallow the decode error rather than rejecting.
            try {
                await new WalletApi(getTonClientV2(mainnetConfig)).getWalletsByPublicKeysBulk({
                    publicKeys: pubkeys,
                    persistentUserId
                });
            } catch (err) {
                console.warn('pubkeysBulkSync: ignored', err);
            }
        },
        [accounts, sdk, mainnetConfig]
    );
};

export const useSyncPubkeysOnAppOpen = () => {
    const { data: accounts, isLoading } = useAccountsStateQuery();
    const syncPubkeys = useSyncPubkeysBulk();
    const hasFiredRef = useRef(false);

    useEffect(() => {
        if (!isLoading && accounts && !hasFiredRef.current) {
            hasFiredRef.current = true;
            syncPubkeys().catch(console.warn);
        }
    }, [isLoading, accounts, syncPubkeys]);
};
