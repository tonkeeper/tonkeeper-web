import { FC, ReactNode, useState } from 'react';
import { MockAppSdk } from '@tonkeeper/core/dist/AppSdk';

import { AppSdkContext } from '../../../../hooks/appSdk';

/**
 * CT mount wrapper: the default MockAppSdk reports no links interceptor,
 * and the intercept-links page redirects away without one. This swaps in
 * an sdk that has the interceptor, as the extension shell does.
 *
 * Lives outside the `*.ct.tsx` file because Playwright's static
 * mount-loader can't resolve components defined in the test file itself.
 */
export const LinksInterceptorHarness: FC<{ children: ReactNode }> = ({ children }) => {
    const [sdk] = useState(() => {
        const nextSdk = new MockAppSdk();
        nextSdk.linksInterceptorAvailable = true;
        return nextSdk;
    });

    return <AppSdkContext.Provider value={sdk}>{children}</AppSdkContext.Provider>;
};
