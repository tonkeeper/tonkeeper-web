import { FC, ReactNode, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { MockAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { MemoryStorage } from '@tonkeeper/core/dist/Storage';

import { buildActiveMultichainAccount } from '../../../../../playwright/multichainAccountFixture';
import { AppSdkContext } from '../../../../hooks/appSdk';
import { QueryKey } from '../../../../libs/queryKey';

/**
 * CT mount wrapper: the default fixture stores a keychain-auth account,
 * which hides the app-password rows (`useIsPasswordSet` is false). This
 * swaps in an sdk whose account is secured by the app password so the
 * lock-screen toggle renders, as it does on web profiles.
 *
 * Lives outside the `*.ct.tsx` file because Playwright's static
 * mount-loader can't resolve components defined in the test file itself.
 */
export const PasswordProfileHarness: FC<{ children: ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const [sdk] = useState(() => {
        const nextSdk = new MockAppSdk();
        const account = buildActiveMultichainAccount();
        account.auth = { kind: 'password', encryptedSecret: 'ct-encrypted-secret' };
        // MemoryStorage is sync under its async API — seed the map so the
        // first render already sees the password-auth account.
        const memory = nextSdk.storage as MemoryStorage;
        memory.storage[AppKey.ACCOUNTS] = [account];
        memory.storage[AppKey.ACTIVE_ACCOUNT_ID] = account.id;
        queryClient.setQueryData([QueryKey.account, QueryKey.wallet], account);
        queryClient.setQueryData([QueryKey.account, QueryKey.wallets], [account]);
        return nextSdk;
    });

    return <AppSdkContext.Provider value={sdk}>{children}</AppSdkContext.Provider>;
};
