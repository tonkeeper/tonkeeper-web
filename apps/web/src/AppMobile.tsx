import { Account } from '@tonkeeper/core/dist/entries/account';
import { MultichainPromo } from '@tonkeeper/uikit/dist/components/modals/MultichainPromoModal';
import { HomeMultichain } from '@tonkeeper/uikit/dist/pages/home/multichain/HomeMultichain';
import { MultichainBackgroundElements } from '@tonkeeper/uikit/dist/pages/home/multichain/MultichainBackgroundElements';
import { MultichainAssetPage } from '@tonkeeper/uikit/dist/pages/home/multichain/asset/MultichainAssetPage';
import { MultichainHistory } from '@tonkeeper/uikit/dist/pages/home/multichain/history/MultichainHistory';
import { MultichainCollectiblesPage } from '@tonkeeper/uikit/dist/pages/home/multichain/collectibles/MultichainCollectiblesPage';
import { MultichainCollectiblesSettingsPage } from '@tonkeeper/uikit/dist/pages/home/multichain/collectibles/MultichainCollectiblesSettingsPage';
import { MultichainTradePage } from '@tonkeeper/uikit/dist/pages/home/multichain/trade/MultichainTradePage';
import { MultichainStakingPositionPage } from '@tonkeeper/uikit/dist/pages/home/multichain/staking/MultichainStakingPositionPage';
import { MultichainBrowserPage } from '@tonkeeper/uikit/dist/pages/home/multichain/browser/MultichainBrowserPage';
import { MultichainSettingsRouting } from '@tonkeeper/uikit/dist/pages/home/multichain/settings/MultichainSettingsRouting';
import { BrowserCategoryPage } from '@tonkeeper/uikit/dist/pages/home/multichain/browser/BrowserCategoryPage';
import { InnerBody, useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { Footer } from '@tonkeeper/uikit/dist/components/Footer';
import { Header } from '@tonkeeper/uikit/dist/components/Header';
import { AppLayout } from '@tonkeeper/uikit/dist/components/layout/AppLayout';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import MemoryScroll from '@tonkeeper/uikit/dist/components/MemoryScroll';
import {
    ActivitySkeletonPage,
    BrowserSkeletonPage,
    CoinSkeletonPage,
    HomeSkeleton,
    SettingsSkeletonPage
} from '@tonkeeper/uikit/dist/components/Skeleton';
import {
    AddFavoriteNotification,
    EditFavoriteNotification
} from '@tonkeeper/uikit/dist/components/transfer/FavoriteNotification';
import { useTrackLocation } from '@tonkeeper/uikit/dist/hooks/analytics';
import { useTrackLaunchApp } from '@tonkeeper/uikit/dist/hooks/analytics/launch-app';
import { useTrackWalletOpen } from '@tonkeeper/uikit/dist/hooks/analytics/wallet-open';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import {
    AppRoute,
    MultichainRoute,
    scrollPagePathname,
    SignerRoute,
    SettingsRoute
} from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import StartScreen from '@tonkeeper/uikit/dist/pages/import/StartScreen';
import React, { FC, ReactNode, Suspense, useLayoutEffect, useMemo, useRef } from 'react';
import { Route, Switch, useLocation, useParams } from 'react-router-dom';
import { ThemeProvider, useTheme } from 'styled-components';
import { useAppWidth } from './libs/hooks';
import { UrlTonConnectSubscription } from './components/UrlTonConnectSubscription';
import { useRealtimeUpdatesInvalidation } from '@tonkeeper/uikit/dist/hooks/realtime';
import { RedirectFromDesktopSettings } from '@tonkeeper/uikit/dist/pages/settings/RedirectFromDesktopSettings';

const Settings = React.lazy(() => import('@tonkeeper/uikit/dist/pages/settings'));
const Browser = React.lazy(() => import('@tonkeeper/uikit/dist/pages/browser'));
const Activity = React.lazy(() => import('@tonkeeper/uikit/dist/pages/activity/Activity'));
const Home = React.lazy(() => import('@tonkeeper/uikit/dist/pages/home/Home'));
const Coin = React.lazy(() => import('@tonkeeper/uikit/dist/pages/coin/Coin'));
const SwapPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/swap'));
const StakingPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/staking'));
const WebTonConnectSubscription = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/connect/WebTonConnectSubscription')
);
const MultichainConnectSubscription = React.lazy(
    () =>
        import('@tonkeeper/uikit/dist/pages/home/multichain/connect/MultichainConnectSubscription')
);
const SendActionNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/transfer/SendNotifications')
);
const ReceiveNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/home/ReceiveNotification')
);
const NftNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/nft/NftNotification')
);
const SendNftNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/transfer/nft/SendNftNotification')
);

const PairSignerNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/PairSignerNotification')
);
const PairKeystoneNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/PairKeystoneNotification')
);
const SignerLinkPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/signer/LinkPage'));
const SignerPublishNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/pages/signer/PublishNotification')
);

const ConnectLedgerNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/ConnectLedgerNotification')
);
const SwapMobileNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/pages/swap/SwapMobileNotification')
);

export const MobileView: FC<{
    activeAccount?: Account | null;
    lock: boolean;
    standalone: boolean;
}> = ({ activeAccount, lock, standalone }) => {
    const theme = useTheme();
    useWindowsScroll();
    useAppWidth(standalone);
    useTrackLocation();
    useTrackLaunchApp();
    useTrackWalletOpen();
    useDebuggingTools();
    useRealtimeUpdatesInvalidation();

    const updated = useMemo(() => {
        theme.displayType = 'compact';
        return theme;
    }, [theme]);

    return (
        <ThemeProvider theme={updated}>
            <MobileContent activeAccount={activeAccount} lock={lock} standalone={standalone} />
        </ThemeProvider>
    );
};

/**
 * Scroll surface for the multichain routes.
 *
 * They own their chrome instead of going through `AppLayout`, so in a browser
 * tab they simply scroll the window — `MemoryScroll` then restores the offset
 * per path. An iOS PWA has no window scroller to use: `useWindowsScroll` locks
 * `html` / `body` / `#root` there, and `AppLayout` compensates by turning
 * itself into a fixed box whose children scroll. These routes need the same
 * treatment, plus the top safe-area inset the legacy `Header` used to carry.
 */
const MultichainScrollRoot: FC<{ standalone: boolean; children: ReactNode }> = ({
    standalone,
    children
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { pathname } = useLocation();
    const scrollPage = scrollPagePathname(pathname);

    useLayoutEffect(() => {
        scrollRef.current?.scrollTo({ top: 0 });
    }, [scrollPage]);

    if (!standalone) {
        return (
            <>
                {children}
                <MemoryScroll />
            </>
        );
    }

    return (
        <div
            ref={scrollRef}
            className="fixed inset-0 overflow-y-auto overflow-x-hidden pt-[env(safe-area-inset-top)]"
        >
            {children}
        </div>
    );
};

export const MobileContent: FC<{
    activeAccount?: Account | null;
    lock: boolean;
    standalone: boolean;
}> = ({ activeAccount, lock, standalone }) => {
    const location = useLocation();

    if (lock) {
        return <Unlock />;
    }

    if (location.pathname.startsWith(AppRoute.signer)) {
        return (
            <AppLayout standalone={standalone}>
                <Switch>
                    <Route path={AppRoute.signer}>
                        <Route path={SignerRoute.link}>
                            <Suspense>
                                <SignerLinkPage />
                            </Suspense>
                        </Route>
                    </Route>
                </Switch>
            </AppLayout>
        );
    }

    if (!activeAccount || location.pathname.startsWith(AppRoute.import)) {
        return (
            <AppLayout bare>
                <Suspense fallback={<Loading />}>
                    <StartScreen />
                </Suspense>
            </AppLayout>
        );
    }

    // Multichain portfolio renders its own content directly. No legacy
    // Home selector, no AppLayout, no Suspense — fully independent
    // until the new chrome lands.
    if (activeAccount.type === 'multichain') {
        return (
            <>
                <MultichainScrollRoot standalone={standalone}>
                    <Switch>
                        <Route path={`${MultichainRoute.asset}/:assetId`}>
                            <MultichainAssetRoute />
                        </Route>
                        <Route path={MultichainRoute.history}>
                            <MultichainHistory />
                        </Route>
                        <Route path={MultichainRoute.collectiblesSettings}>
                            <MultichainCollectiblesSettingsPage />
                        </Route>
                        <Route path={MultichainRoute.collectibles}>
                            <MultichainCollectiblesPage />
                        </Route>
                        <Route path={MultichainRoute.trade}>
                            <MultichainTradePage />
                        </Route>
                        <Route path={`${MultichainRoute.staking}/:poolAddress`}>
                            <MultichainStakingPositionRoute />
                        </Route>
                        <Route path={`${MultichainRoute.browserCategory}/:id`}>
                            <BrowserCategoryPage />
                        </Route>
                        <Route path={MultichainRoute.browser}>
                            <MultichainBrowserPage />
                        </Route>
                        <Route path={MultichainRoute.settings}>
                            <MultichainSettingsRouting />
                        </Route>
                        <Route path="*">
                            <HomeMultichain />
                        </Route>
                    </Switch>
                </MultichainScrollRoot>
                <MultichainBackgroundElements />
                <Suspense>
                    <WebTonConnectSubscription />
                    <UrlTonConnectSubscription />
                    <MultichainConnectSubscription />
                </Suspense>
            </>
        );
    }

    return (
        <AppLayout
            standalone={standalone}
            recovery={location.pathname.includes(SettingsRoute.recovery)}
            bottomBar={<Footer standalone={standalone} />}
        >
            <Switch>
                <Route path={AppRoute.activity}>
                    <Suspense fallback={<ActivitySkeletonPage />}>
                        <Activity />
                    </Suspense>
                </Route>
                <Route path={AppRoute.browser}>
                    <Suspense fallback={<BrowserSkeletonPage />}>
                        <Browser />
                    </Suspense>
                </Route>
                <Route path={AppRoute.settings}>
                    <Suspense fallback={<SettingsSkeletonPage />}>
                        <Settings />
                    </Suspense>
                </Route>
                <Route path={AppRoute.walletSettings}>
                    <RedirectFromDesktopSettings />
                </Route>
                <Route path={`${AppRoute.coins}/:name`}>
                    <Suspense fallback={<CoinSkeletonPage />}>
                        <Coin />
                    </Suspense>
                </Route>
                <Route path={AppRoute.swap}>
                    <Suspense fallback={null}>
                        <SwapPage />
                    </Suspense>
                </Route>
                <Route path={AppRoute.staking}>
                    <Suspense fallback={null}>
                        <StakingPage />
                    </Suspense>
                </Route>
                <Route path="*">
                    <>
                        <Header />
                        <InnerBody>
                            <Suspense fallback={<HomeSkeleton />}>
                                <Home />
                            </Suspense>
                        </InnerBody>
                    </>
                </Route>
            </Switch>
            <MemoryScroll />
            <Notifications />
            <UrlTonConnectSubscription />
        </AppLayout>
    );
};

const MultichainAssetRoute: FC = () => {
    const { assetId } = useParams<{ assetId: string }>();
    return <MultichainAssetPage assetId={decodeURIComponent(assetId)} />;
};

const MultichainStakingPositionRoute: FC = () => {
    const { poolAddress } = useParams<{ poolAddress: string }>();
    return <MultichainStakingPositionPage poolAddress={decodeURIComponent(poolAddress)} />;
};

const Notifications = () => {
    return (
        <Suspense>
            <SendActionNotification />
            <ReceiveNotification />
            <WebTonConnectSubscription />
            <MultichainConnectSubscription />
            <NftNotification />
            <SendNftNotification />
            <AddFavoriteNotification />
            <EditFavoriteNotification />
            <PairSignerNotification />
            <SignerPublishNotification />
            <ConnectLedgerNotification />
            <SwapMobileNotification />
            <PairKeystoneNotification />
            <MultichainPromo />
        </Suspense>
    );
};
