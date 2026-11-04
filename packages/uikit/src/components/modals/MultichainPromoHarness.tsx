import { FC, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MockAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { MemoryStorage } from '@tonkeeper/core/dist/Storage';

import { AppSdkContext } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { buildLegacyMnemonicAccount } from '../../pages/home/multichain/FinishSetupHarness';

/**
 * CT mount wrapper for an install with legacy TON wallets only — the state
 * the promo exists for. The default fixture's active account is multichain,
 * which keeps the promo hidden. `promoShown` marks it as already spent.
 */
export const LegacyOnlyPromoHarness: FC<{ children: ReactNode; promoShown?: boolean }> = ({
    children,
    promoShown
}) => {
    const queryClient = useQueryClient();
    const [sdk] = useState(() => {
        const nextSdk = new MockAppSdk();
        const legacy = buildLegacyMnemonicAccount({ id: 'acc:legacy', name: 'TON Wallet' });

        const memory = nextSdk.storage as MemoryStorage;
        memory.storage[AppKey.ACCOUNTS] = [legacy];
        memory.storage[AppKey.ACTIVE_ACCOUNT_ID] = legacy.id;
        if (promoShown) {
            memory.storage[AppKey.MULTICHAIN_PROMO_SHOWN] = true;
        }

        queryClient.setQueryData([QueryKey.account, QueryKey.wallet], legacy);
        queryClient.setQueryData([QueryKey.account, QueryKey.wallets], [legacy]);
        return nextSdk;
    });

    return <AppSdkContext.Provider value={sdk}>{children}</AppSdkContext.Provider>;
};
