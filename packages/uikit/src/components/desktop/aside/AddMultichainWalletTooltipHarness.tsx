import { FC, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MockAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { MemoryStorage } from '@tonkeeper/core/dist/Storage';

import { AppSdkContext } from '../../../hooks/appSdk';
import { QueryKey } from '../../../libs/queryKey';
import { buildLegacyMnemonicAccount } from '../../../pages/home/multichain/FinishSetupHarness';

/**
 * CT mount wrapper for an install with legacy TON wallets only — the state
 * the add-wallet nudge exists for. The default fixture's active account is
 * multichain, which hides the bubble. `shownCount` pre-spends the show
 * budget so a test can assert the cap.
 */
export const LegacyOnlyHarness: FC<{ children: ReactNode; shownCount?: number }> = ({
    children,
    shownCount
}) => {
    const queryClient = useQueryClient();
    const [sdk] = useState(() => {
        const nextSdk = new MockAppSdk();
        const legacy = buildLegacyMnemonicAccount({ id: 'acc:legacy', name: 'TON Wallet' });

        const memory = nextSdk.storage as MemoryStorage;
        memory.storage[AppKey.ACCOUNTS] = [legacy];
        memory.storage[AppKey.ACTIVE_ACCOUNT_ID] = legacy.id;
        if (shownCount !== undefined) {
            memory.storage[AppKey.MULTICHAIN_ADD_WALLET_TOOLTIP_STATE] = {
                shownCount,
                lastShownDay: 'Thu Jan 01 1970'
            };
        }

        queryClient.setQueryData([QueryKey.account, QueryKey.wallet], legacy);
        queryClient.setQueryData([QueryKey.account, QueryKey.wallets], [legacy]);
        return nextSdk;
    });

    return <AppSdkContext.Provider value={sdk}>{children}</AppSdkContext.Provider>;
};

/** The sidebar row the bubble anchors to, stood in for the legacy styled item. */
export const AddWalletRowStub: FC = () => (
    <button
        type="button"
        className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-label2 text-textPrimary"
    >
        <span className="size-6 rounded-full bg-iconSecondary" />
        Add Wallet
    </button>
);
