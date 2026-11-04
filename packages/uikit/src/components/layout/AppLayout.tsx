import { FC, ReactNode } from 'react';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { cn } from '../../libs/css';

/**
 * The single layout primitive every app shell composes around its routes.
 *
 * ## Why
 *
 * Before this primitive each app (web, extension, desktop-electron, twa,
 * mobile-capacitor) shipped its own `Wrapper` / `FullSizeWrapper` /
 * `PageWrapper` / `FullSizeWrapperBounded` / `InitWrapper` plus an ad-hoc
 * `if (onboarding) return <Bare/>` branch inside the shell. The chrome
 * (sidebar, top bar, bottom bar) was assembled differently in every
 * shell, and pages routinely owned their own outer container too — making
 * a global layout change a five-shell edit.
 *
 * `AppLayout` owns the two product layouts and the onboarding opt-out:
 *
 * - **Desktop** (`displayType === 'full-width'`) — two-column: the
 *   `sidebar` slot pinned on the left, content on the right. The
 *   sidebar is the persistent left-rail navigation (e.g. `AsideMenu`);
 *   secondary, page-level chrome (page header, sub-sidebar, in-page
 *   tabs) belongs inside `children`.
 *
 * - **Mobile / compact** (`displayType === 'compact'`) — single column
 *   with a sticky `topBar` and a sticky `bottomBar` surrounding the
 *   content. The bars are themselves `position: fixed` today
 *   (`Header.tsx`, `Footer.tsx`); `AppLayout` reserves the matching
 *   safe space on the content area so pages don't have to know the bar
 *   heights.
 *
 * - **Bare** (`bare`) — onboarding / unlock / lock-screen pages. Renders
 *   only the content area, centered, viewport-bound. No sidebar, no top
 *   bar, no bottom bar. This is the StartScreen / ImportWallet shape.
 *
 * Slots not relevant to the current mode are simply ignored — e.g.
 * passing `topBar` in desktop mode is a no-op. App shells pass the same
 * `sidebar` / `topBar` / `bottomBar` once and let the primitive pick.
 *
 * ## What `AppLayout` is *not*
 *
 * It is not a router and it is not a page. It is the structural scaffold
 * between the app's root providers and its `<Switch>` of routes. Pages
 * still own their own content; secondary chrome (e.g. `DesktopWalletHeader`
 * + `WalletAsideMenu`, or the per-page mobile `<Header>` on the home
 * route) stays inside the page or its sub-layout.
 *
 * ## Styling
 *
 * Tailwind only — this primitive ships with the multichain redesign and
 * follows the "new components are Tailwind, no styled-components" rule
 * documented in CLAUDE.md under "Styling".
 */
export type AppLayoutProps = {
    /**
     * Persistent left-rail navigation rendered only in `full-width`
     * (desktop) mode. Typically `<AsideMenu />`. Ignored in `compact`
     * and `bare`.
     */
    sidebar?: ReactNode;

    /**
     * Mobile top bar (e.g. `<Header />`). Rendered only in `compact`
     * mode. The bar itself is `position: fixed`; `AppLayout` reserves
     * `padding-top` on the content area to clear it. Ignored in
     * `full-width` and `bare`.
     */
    topBar?: ReactNode;

    /**
     * Mobile bottom bar (e.g. `<Footer />`). Rendered only in `compact`
     * mode. The bar itself is `position: fixed`; `AppLayout` reserves
     * `padding-bottom` on the content area. Ignored in `full-width` and
     * `bare`.
     */
    bottomBar?: ReactNode;

    /**
     * `true` strips chrome — no sidebar, no top bar, no bottom bar.
     * Used for onboarding (StartScreen, ImportWallet) and the lock
     * screen. The content area is centered and viewport-bound.
     */
    bare?: boolean;

    /**
     * `true` when the host is an iOS PWA / Capacitor standalone shell —
     * the mobile bottom bar gets extra padding for the home-indicator
     * safe area, matching the legacy `Wrapper.standalone` behaviour.
     */
    standalone?: boolean;

    /**
     * Suppress the mobile top padding for routes that render no header
     * (the legacy "recovery" override on the Settings recovery screen).
     * Carries through 1:1 from the pre-AppLayout shells; once those
     * pages adopt their own AppLayout-aware headers this prop becomes
     * unnecessary.
     */
    recovery?: boolean;

    /**
     * Disable the legacy Header/Footer offsets when a compact experience owns
     * its chrome in-page (for example, the multichain header and tab bar).
     */
    compactChromeOffsets?: boolean;

    children: ReactNode;
};

export const AppLayout: FC<AppLayoutProps> = ({
    sidebar,
    topBar,
    bottomBar,
    bare,
    standalone,
    recovery,
    compactChromeOffsets = true,
    children
}) => {
    const isFullWidth = useIsFullWidthMode();

    if (bare) {
        // Onboarding chrome. Centred column, viewport-bound, page-color
        // background — exactly the legacy `FullScreen` / `FullSizeWrapper`
        // / `InitWrapper` / `FullSizeWrapperBounded` shape, collapsed into
        // one. Width is intentionally unbounded here; the content (e.g.
        // `StartScreen`) declares its own `max-w` (524px today) so this
        // primitive doesn't pick a global width for unrelated pages.
        return (
            <div className="box-border flex min-h-[var(--app-height,100vh)] w-full flex-col items-center justify-center bg-backgroundPage">
                {children}
            </div>
        );
    }

    if (isFullWidth) {
        // Desktop two-column root. The sidebar slot floats on the left at
        // its intrinsic width; the main column fills the rest. `min-w-0` /
        // `min-h-0` on the main column let inner scroll containers behave.
        return (
            <div className="flex h-full w-full bg-backgroundPage">
                {sidebar}
                <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
            </div>
        );
    }

    // Mobile root. The bars (`<Header>`, `<Footer>`) self-position with
    // `position: fixed` today, so AppLayout doesn't position them — it
    // only reserves the matching safe space on the content via padding.
    //
    // Padding defaults to the legacy 64px top and 80/96px bottom offsets,
    // matching the pre-AppLayout `Wrapper`. Compact experiences that own
    // their chrome in-page can opt out; the Settings recovery route can
    // continue to suppress only the top offset.
    //
    // Future work: route-driven topBar slots, at which point this padding
    // becomes `topBar ? 64 : 0` and the `recovery` prop goes away.
    return (
        <div
            className={cn(
                'mx-auto box-border flex min-h-[var(--app-height)] min-w-[300px] max-w-[550px] flex-col whitespace-pre-wrap bg-backgroundPage',
                !compactChromeOffsets || recovery ? 'pt-0' : 'pt-16',
                !compactChromeOffsets ? 'pb-0' : standalone ? 'pb-24' : 'pb-20',
                standalone &&
                    'fixed top-0 h-[calc(var(--app-height)-2px)] [-webkit-overflow-scrolling:touch]',
                standalone &&
                    '[&>*]:box-border [&>*]:w-[var(--app-width)] [&>*]:max-w-[548px] [&>*]:overflow-auto',
                !standalone &&
                    'min-[600px]:border-l min-[600px]:border-r min-[600px]:border-separatorCommon'
            )}
        >
            {topBar}
            {children}
            {bottomBar}
        </div>
    );
};
