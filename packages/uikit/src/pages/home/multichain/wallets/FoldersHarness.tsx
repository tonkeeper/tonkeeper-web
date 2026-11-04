import { FC, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { MockAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { MemoryStorage } from '@tonkeeper/core/dist/Storage';
import { GlobalPreferences } from '@tonkeeper/core/dist/service/globalPreferencesService';
import { DEFAULT_DUST_FILTERS } from '@tonkeeper/core/dist/service/dustFilterService';
import type { SafeModeState } from '@tonkeeper/core/dist/service/safeModeService';

import { buildMultichainAccount } from '../../../../../playwright/multichainAccountFixture';
import { useAppContext } from '../../../../hooks/appContext';
import { AppSdkContext } from '../../../../hooks/appSdk';
import { QueryKey } from '../../../../libs/queryKey';
import { multichainWalletAssetsQueryKey } from '../../../../state/multichain/useMultichainWalletAssets';

/**
 * CT mount wrapper: the default fixture seeds one account and no folders,
 * so folder rows in the manage modal and the sidebar folder tabs never
 * render. This swaps in an sdk with four accounts — "Everyday" (active) +
 * "Trading" inside an expanded "Personal" folder, "Savings" inside a
 * collapsed "Work" folder, and a loose "Tests" account that surfaces the
 * implicit "Other" sidebar tab.
 *
 * Lives outside the `*.ct.tsx` files because Playwright's static
 * mount-loader can't resolve components defined in the test file itself.
 */
export const FoldersHarness: FC<{ children: ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const { mainnetConfig } = useAppContext();
    const safeModeServerDefault = mainnetConfig.flags?.safe_mode_enabled ?? false;
    const [sdk] = useState(() => {
        const nextSdk = new MockAppSdk();

        const everyday = buildMultichainAccount({
            id: 'acc:everyday',
            name: 'Everyday',
            emoji: '🐹'
        });
        const trading = buildMultichainAccount({
            id: 'acc:trading',
            name: 'Trading',
            emoji: '🌿'
        });
        const savings = buildMultichainAccount({
            id: 'acc:savings',
            name: 'Savings',
            emoji: '⚡'
        });
        const tests = buildMultichainAccount({ id: 'acc:tests', name: 'Tests', emoji: '✋' });
        const accounts = [everyday, trading, savings, tests];

        const preferences: GlobalPreferences = {
            folders: [
                {
                    id: 'folder-personal',
                    type: 'folder',
                    name: 'Personal',
                    accounts: [everyday.id, trading.id],
                    lastIsOpened: true
                },
                {
                    id: 'folder-work',
                    type: 'folder',
                    name: 'Work',
                    accounts: [savings.id],
                    lastIsOpened: false
                }
            ],
            sideBarOrder: ['folder-personal', 'folder-work', tests.id],
            historyFilterSpam: false,
            highlightFeatures: { tron: true },
            interceptTonLinks: 'ask',
            walletColors: {}
        };

        // MemoryStorage is sync under its async API — seed the map so the
        // first render already sees the accounts and folders.
        const memory = nextSdk.storage as MemoryStorage;
        memory.storage[AppKey.ACCOUNTS] = accounts;
        memory.storage[AppKey.ACTIVE_ACCOUNT_ID] = everyday.id;
        memory.storage[AppKey.GLOBAL_PREFERENCES_CONFIG] = preferences;

        queryClient.setQueryData([QueryKey.account, QueryKey.wallet], everyday);
        queryClient.setQueryData([QueryKey.account, QueryKey.wallets], accounts);
        queryClient.setQueryData([QueryKey.globalPreferencesConfig], preferences);
        // Row captions read each account's portfolio entry — the one its home
        // screen shows; seeding them keeps the list off the multichain
        // backend. The entry is keyed on the safe-mode and dust flags its
        // request would carry, so each account's safe mode has to be seeded
        // alongside (the dust filters are install-wide and come from the
        // mount harness).
        const safeMode: SafeModeState = { enabled: false, temporarilyDisabled: false };
        accounts.forEach((account, index) => {
            queryClient.setQueryData(
                [QueryKey.safeMode, account.id, safeModeServerDefault],
                safeMode
            );
            queryClient.setQueryData(
                multichainWalletAssetsQueryKey(
                    account.multichainWalletId,
                    account.activeTonWallet.id,
                    FiatCurrencies.USD,
                    safeMode.enabled,
                    DEFAULT_DUST_FILTERS.hideDustBalances
                ),
                { assets: [], totalFiat: new BigNumber('1000').multipliedBy(index + 1) }
            );
        });

        return nextSdk;
    });

    return <AppSdkContext.Provider value={sdk}>{children}</AppSdkContext.Provider>;
};
