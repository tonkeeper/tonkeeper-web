import { FC, ReactNode, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

import { AccountMultichain } from '@tonkeeper/core/dist/entries/account';

import { cn } from '../../../../libs/css';
import { MultichainRoute, scrollPagePathname } from '../../../../libs/routes';
import { useMultichainWalletAssets } from '../../../../state/multichain/useMultichainWalletAssets';
import { MultichainDesktopSidebar } from './MultichainDesktopSidebar';
import { MultichainDesktopTabBar } from './MultichainDesktopTabBar';

/**
 * Desktop layout for multichain accounts.
 *
 * Window: 24px padding, except on the right — the content area runs to the
 * window edge and centers its 520px column inside it, which is what puts the
 * column where the mockup has it.
 * Sidebar: fixed-width column on the left, full height of the window
 * container (height stretches to the window).
 * Content: flex-centered 520px column with 24px vertical padding (the
 * outer 24px already accounts for that, so the column simply lives
 * inside the flex track and renders its own scroll area).
 *
 * Mobile is unchanged — `AppMobile.tsx` keeps rendering pages without
 * any shell. Only AppDesktop swaps in this layout for multichain
 * accounts.
 */
export const MultichainDesktopShell: FC<{
    account: AccountMultichain;
    children: ReactNode;
}> = ({ account, children }) => {
    const { pathname } = useLocation();
    const scrollRef = useRef<HTMLDivElement>(null);
    const { data: assets } = useMultichainWalletAssets();

    // The scroll container survives route changes, so a subpage opened from
    // a scrolled column would otherwise inherit the previous scroll offset.
    const scrollPage = scrollPagePathname(pathname);
    useLayoutEffect(() => {
        scrollRef.current?.scrollTo(0, 0);
    }, [scrollPage]);

    // The asset page owns the bottom of the column: its Buy/Sell bar sticks
    // there, and the mockup shows no section nav underneath it.
    const showTabBar = !pathname.startsWith(MultichainRoute.asset);

    return (
        <div className="flex h-screen gap-6 overflow-hidden bg-backgroundPage py-6 pl-6">
            <MultichainDesktopSidebar account={account} totalFiat={assets?.totalFiat} />
            <main className="flex flex-1 justify-center">
                <div className="flex h-full w-full max-w-[520px] flex-col">
                    {/* The tab bar overlaps the bottom 36px of the scroll area
                        (its negative top margin); the matching bottom padding
                        lets the last row scroll fully out from behind it. */}
                    <div
                        ref={scrollRef}
                        className={cn(
                            'flex-1 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
                            showTabBar && 'pb-9'
                        )}
                    >
                        {children}
                    </div>
                    {showTabBar && <MultichainDesktopTabBar />}
                </div>
            </main>
        </div>
    );
};
