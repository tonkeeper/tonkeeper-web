import { FC, ReactNode } from 'react';
import BigNumber from 'bignumber.js';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';

import { useActiveAccount } from '../../../../state/wallet';
import { MultichainDesktopSidebar } from './MultichainDesktopSidebar';

export const SidebarStage: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="flex h-[560px] w-[328px] bg-backgroundPage p-6">{children}</div>
);

// Playwright CT serializes mount props across the Node→browser boundary, which
// drops class prototypes — a `BigNumber` arrives as a plain object and the
// formatter then reads it as `NaN`. Reconstruct the total here, where the body
// runs in the browser. The account comes from the seeded state for the same
// reason: the sidebar reads its TON address off the class instance.
export const SidebarHarness: FC<{ totalFiatStr?: string }> = ({ totalFiatStr }) => {
    const account = useActiveAccount() as AccountMultichain;
    return (
        <MultichainDesktopSidebar
            account={account}
            totalFiat={totalFiatStr === undefined ? undefined : new BigNumber(totalFiatStr)}
        />
    );
};
