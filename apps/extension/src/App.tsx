import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MultichainPromo } from '@tonkeeper/uikit/dist/components/modals/MultichainPromoModal';
import { MULTICHAIN_ENABLED } from '@tonkeeper/core/dist/multichain';
import { initChainKit } from '@tonkeeper/core/dist/service/chainkit/initChainKit';
import { WEB_PUSH_APP_ID } from '@tonkeeper/core/dist/service/chainkit/deviceAuthService';
import { localizationFrom } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig, setProApiUrl } from '@tonkeeper/core/dist/entries/network';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { DocumentLanguageSync } from '@tonkeeper/uikit/dist/components/DocumentLanguageSync';
import { InnerBody, useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { Footer, FooterGlobalStyle } from '@tonkeeper/uikit/dist/components/Footer';
import { Header, HeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/Header';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import MemoryScroll from '@tonkeeper/uikit/dist/components/MemoryScroll';
import {
    ActivitySkeletonPage,
    BrowserSkeletonPage,
    CoinSkeletonPage,
    HomeSkeleton,
    SettingsSkeletonPage
} from '@tonkeeper/uikit/dist/components/Skeleton';
import { SybHeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/SubHeader';
import {
    AddFavoriteNotification,
    EditFavoriteNotification
} from '@tonkeeper/uikit/dist/components/transfer/FavoriteNotification';
import { useTrackLocation } from '@tonkeeper/uikit/dist/hooks/analytics';
import { useTrackLaunchApp } from '@tonkeeper/uikit/dist/hooks/analytics/launch-app';
import { useTrackWalletOpen } from '@tonkeeper/uikit/dist/hooks/analytics/wallet-open';
import { AppContext, IAppContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import { AppSdkContext } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useLock } from '@tonkeeper/uikit/dist/hooks/lock';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import {
    I18nContext,
    TranslationContext,
    useTWithReplaces
} from '@tonkeeper/uikit/dist/hooks/translation';
import { AppRoute, MultichainRoute, SettingsRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import StartScreen from '@tonkeeper/uikit/dist/pages/import/StartScreen';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { useUserFiatQuery } from '@tonkeeper/uikit/dist/state/fiat';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useActiveAccountQuery, useAccountsStateQuery } from '@tonkeeper/uikit/dist/state/wallet';
import { AppLayout } from '@tonkeeper/uikit/dist/components/layout/AppLayout';
import { Container, GlobalStyleCss } from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, {
    FC,
    PropsWithChildren,
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef
} from 'react';
import { MemoryRouter, Route, Switch, useLocation, useParams } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import browser from 'webextension-polyfill';
import { TonConnectSubscription } from './components/TonConnectSubscription';
import { EvmInjectedSubscription } from './components/EvmInjectedSubscription';
import { connectToBackground } from './event';
import { ExtensionAppSdk } from './libs/appSdk';
import { useAnalytics, useAppWidth } from './libs/hooks';
import { useMutateUserLanguage } from '@tonkeeper/uikit/dist/state/language';
import { useDevSettings } from '@tonkeeper/uikit/dist/state/dev';
import { ModalsRoot } from '@tonkeeper/uikit/dist/components/ModalsRoot';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import { useGlobalPreferencesQuery } from '@tonkeeper/uikit/dist/state/global-preferences';
import { useGlobalSetup } from '@tonkeeper/uikit/dist/state/globalSetup';
import { useNavigate } from '@tonkeeper/uikit/dist/hooks/router/useNavigate';
import { useRealtimeUpdatesInvalidation } from '@tonkeeper/uikit/dist/hooks/realtime';
import { RedirectFromDesktopSettings } from '@tonkeeper/uikit/dist/pages/settings/RedirectFromDesktopSettings';
import { Notifications } from './components/Notifications';
import { useProApiUrl } from '@tonkeeper/uikit/dist/state/pro';
import { CustomConfirmNotificationControlled } from '@tonkeeper/uikit/dist/components/modals/CustomConfirmControlled';
import { CryptoStrategyInstaller } from '@tonkeeper/uikit/dist/components/pro/CryptoStrategyInstaller';
import { HomeMultichain } from '@tonkeeper/uikit/dist/pages/home/multichain/HomeMultichain';
import { MultichainBackgroundElements } from '@tonkeeper/uikit/dist/pages/home/multichain/MultichainBackgroundElements';
import { MultichainAssetPage } from '@tonkeeper/uikit/dist/pages/home/multichain/asset/MultichainAssetPage';
import { MultichainHistory } from '@tonkeeper/uikit/dist/pages/home/multichain/history/MultichainHistory';
import { MultichainCollectiblesPage } from '@tonkeeper/uikit/dist/pages/home/multichain/collectibles/MultichainCollectiblesPage';
import { MultichainCollectiblesSettingsPage } from '@tonkeeper/uikit/dist/pages/home/multichain/collectibles/MultichainCollectiblesSettingsPage';
import { MultichainTradePage } from '@tonkeeper/uikit/dist/pages/home/multichain/trade/MultichainTradePage';
import { MultichainBrowserPage } from '@tonkeeper/uikit/dist/pages/home/multichain/browser/MultichainBrowserPage';
import { MultichainSettingsRouting } from '@tonkeeper/uikit/dist/pages/home/multichain/settings/MultichainSettingsRouting';
import { BrowserCategoryPage } from '@tonkeeper/uikit/dist/pages/home/multichain/browser/BrowserCategoryPage';
import { MultichainStakingPositionPage } from '@tonkeeper/uikit/dist/pages/home/multichain/staking/MultichainStakingPositionPage';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { RootErrorBoundary } from '@tonkeeper/uikit/dist/components/shared/RootErrorBoundary';

const Settings = React.lazy(() => import('@tonkeeper/uikit/dist/pages/settings'));
const Browser = React.lazy(() => import('@tonkeeper/uikit/dist/pages/browser'));
const Activity = React.lazy(() => import('@tonkeeper/uikit/dist/pages/activity/Activity'));
const Home = React.lazy(() => import('@tonkeeper/uikit/dist/pages/home/Home'));
const Coin = React.lazy(() => import('@tonkeeper/uikit/dist/pages/coin/Coin'));
const SwapPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/swap'));
const StakingPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/staking'));
const QrScanner = React.lazy(() => import('@tonkeeper/uikit/dist/components/QrScanner'));
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
const ConnectLedgerNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/ConnectLedgerNotification')
);
const SwapMobileNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/pages/swap/SwapMobileNotification')
);
const PairKeystoneNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/PairKeystoneNotification')
);

const ConnectLedgerPage = React.lazy(() => import('./components/ConnectLedgerPage'));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

const sdk = new ExtensionAppSdk();
initChainKit(sdk.storage, {
    platform: 'extension',
    appId: WEB_PUSH_APP_ID,
    clientVersion: sdk.version
});
connectToBackground();

const ExtensionGlobalStyle = createGlobalStyle`
  ${GlobalStyleCss}
  
  body {
      overflow-y: auto;
  }
`;

export const App: FC<{ isInCustomPopup: boolean }> = ({ isInCustomPopup }) => {
    const browserT = useCallback((key: string) => browser.i18n.getMessage(key), []);
    const t = useTWithReplaces(browserT);

    sdk.addWalletPage.isInCustomPopup = isInCustomPopup;

    const translation = useMemo(() => {
        const client: I18nContext = {
            t,
            i18n: {
                enable: false,
                reloadResources: async () => {},
                changeLanguage: async () => {},
                language: browser.i18n.getUILanguage(),
                languages: []
            }
        };
        return client;
    }, [t]);

    return (
        <QueryClientProvider client={queryClient}>
            <AppErrorBoundary>
                <MemoryRouter>
                    <InitialRedirect>
                        <AppSdkContext.Provider value={sdk}>
                            <StorageContext.Provider value={sdk.storage}>
                                <TranslationContext.Provider value={translation}>
                                    <DocumentLanguageSync />
                                    <UserThemeProvider>
                                        <ExtensionGlobalStyle />
                                        <HeaderGlobalStyle />
                                        <FooterGlobalStyle />
                                        <SybHeaderGlobalStyle />
                                        <GlobalListStyle />
                                        <Suspense
                                            fallback={
                                                <ExtensionPopupRoot>
                                                    <Loading />
                                                </ExtensionPopupRoot>
                                            }
                                        >
                                            <RootErrorBoundary FallbackRoot={ExtensionPopupRoot}>
                                                <Loader />
                                            </RootErrorBoundary>
                                        </Suspense>
                                        <UnlockNotification sdk={sdk} />
                                    </UserThemeProvider>
                                </TranslationContext.Provider>
                            </StorageContext.Provider>
                        </AppSdkContext.Provider>
                    </InitialRedirect>
                </MemoryRouter>
            </AppErrorBoundary>
        </QueryClientProvider>
    );
};

/**
 * Extension popup geometry — Container plus the 385px-min / 600px-tall
 * shape every entry path used to set via `FullSizeWrapper` / `Wrapper`.
 * Routes use `AppLayout` for chrome; this wrapper only constrains the
 * popup box itself. In the Chrome side panel the browser owns the viewport,
 * so the box follows it full-height instead of the fixed popup shape.
 */
const ExtensionPopupRoot = styled(Container)`
    min-width: 385px;
    height: 600px;
    width: var(--app-width);

    body[data-app-view='side-panel'] & {
        height: 100vh;
    }

    > * {
        overflow: auto;
        width: var(--app-width);
        max-width: 548px;
        box-sizing: border-box;
    }
`;

export const Loader: FC = React.memo(() => {
    const { data: activeAccount, isLoading: activeWalletLoading } = useActiveAccountQuery();
    const { data: accounts, isLoading: isWalletsLoading } = useAccountsStateQuery();
    const { data: fiat } = useUserFiatQuery();
    const { mutate: setLang } = useMutateUserLanguage();
    const { data: devSettings } = useDevSettings();
    const { isLoading: globalPreferencesLoading } = useGlobalPreferencesQuery();
    const { isLoading: globalSetupLoading } = useGlobalSetup();

    useEffect(() => {
        setLang(localizationFrom(browser.i18n.getUILanguage()));
    }, [setLang]);

    const lock = useLock(sdk);
    const tonendpoint = useTonendpoint({
        build: sdk.version,
        lang: localizationFrom(browser.i18n.getUILanguage()),
        platform: 'extension'
    });
    const { data: serverConfig } = useTonenpointConfig(tonendpoint);
    const { data: proApiUrl } = useProApiUrl(serverConfig?.mainnetConfig);

    const { data: tracker } = useAnalytics(
        serverConfig?.mainnetConfig,
        activeAccount || undefined,
        accounts
    );

    if (
        activeWalletLoading ||
        isWalletsLoading ||
        !serverConfig ||
        lock === undefined ||
        fiat === undefined ||
        proApiUrl === undefined ||
        !devSettings ||
        globalPreferencesLoading ||
        globalSetupLoading
    ) {
        return (
            <ExtensionPopupRoot>
                <Loading />
            </ExtensionPopupRoot>
        );
    }

    // set api url synchronously
    setProApiUrl(proApiUrl);

    const context: IAppContext = {
        mainnetApi: getApiConfig(serverConfig.mainnetConfig),
        testnetApi: getApiConfig(serverConfig.testnetConfig),
        fiat,
        mainnetConfig: serverConfig.mainnetConfig,
        testnetConfig: serverConfig.testnetConfig,
        tonendpoint,
        ios: false,
        standalone: true,
        extension: true,
        proFeatures: false,
        hideQrScanner: true,
        hideSigner: true,
        hideMultisig: true,
        hideFireblocks: true,
        defaultWalletVersion: WalletVersion.V5R1,
        multichainEnabled: MULTICHAIN_ENABLED,
        tracker: tracker?.track
    };

    return (
        <AppContext.Provider value={context}>
            <CryptoStrategyInstaller>
                <Content activeAccount={activeAccount} lock={lock} />
                <CopyNotification />
                <Suspense fallback={<></>}>
                    <QrScanner />
                </Suspense>
                <ModalsRoot />
                <CustomConfirmNotificationControlled />
            </CryptoStrategyInstaller>
        </AppContext.Provider>
    );
});

const InitialRedirect: FC<PropsWithChildren> = ({ children }) => {
    const navigate = useNavigate();

    // Must fire exactly once: the MemoryRouter never clears the page URL's
    // hash, and `navigate` changes identity on every navigation, so keying
    // this effect on `navigate` alone re-navigates in an infinite render loop.
    const redirected = useRef(false);
    useEffect(() => {
        if (!redirected.current && window.location.hash) {
            redirected.current = true;
            navigate(window.location.hash.substring(1));
        }
    }, [navigate]);

    return <>{children}</>;
};

export const Content: FC<{
    activeAccount?: Account | null;
    lock: boolean;
}> = ({ activeAccount, lock }) => {
    const location = useLocation();

    const pageView = !activeAccount || location.pathname.startsWith(AppRoute.import);

    useWindowsScroll(!pageView);
    useAppWidth();
    useTrackLocation();
    useTrackLaunchApp();
    useTrackWalletOpen();
    useDebuggingTools();
    useRealtimeUpdatesInvalidation();

    if (location.pathname === AppRoute.connectLedger) {
        return (
            <ExtensionPopupRoot>
                <AppLayout bare>
                    <Suspense fallback={<Loading />}>
                        <ConnectLedgerPage />
                    </Suspense>
                </AppLayout>
            </ExtensionPopupRoot>
        );
    }

    if (lock) {
        return <Unlock />;
    }

    if (pageView) {
        return (
            <ExtensionPopupRoot>
                <AppLayout bare>
                    <Suspense fallback={<Loading />}>
                        <StartScreen />
                    </Suspense>
                </AppLayout>
            </ExtensionPopupRoot>
        );
    }

    if (activeAccount?.type === 'multichain') {
        return (
            <ExtensionPopupRoot>
                <AppLayout standalone compactChromeOffsets={false}>
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
                    <MemoryScroll />
                    <Notifications />
                    <TonConnectSubscription />
                    <EvmInjectedSubscription />
                    <MultichainBackgroundElements />
                    <Suspense>
                        <ReceiveNotification />
                        <NftNotification />
                        <SendNftNotification />
                        <AddFavoriteNotification />
                        <EditFavoriteNotification />
                        <ConnectLedgerNotification />
                        <SwapMobileNotification />
                        <PairKeystoneNotification />
                    </Suspense>
                </AppLayout>
            </ExtensionPopupRoot>
        );
    }

    return (
        <ExtensionPopupRoot>
            <AppLayout
                standalone
                recovery={location.pathname.includes(SettingsRoute.recovery)}
                bottomBar={<Footer />}
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
                    <Route path="*" component={IndexPage} />
                </Switch>
                <MemoryScroll />
                <Notifications />
                <TonConnectSubscription />
                <EvmInjectedSubscription />
                <MultichainPromo />
                <Suspense>
                    <SendActionNotification />
                    <ReceiveNotification />
                    <NftNotification />
                    <SendNftNotification />
                    <AddFavoriteNotification />
                    <EditFavoriteNotification />
                    <ConnectLedgerNotification />
                    <SwapMobileNotification />
                    <PairKeystoneNotification />
                </Suspense>
            </AppLayout>
        </ExtensionPopupRoot>
    );
};

const IndexPage = () => {
    return (
        <>
            <Header showQrScan={false} />
            <InnerBody>
                <Suspense fallback={<HomeSkeleton />}>
                    <Home />
                </Suspense>
            </InnerBody>
        </>
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
