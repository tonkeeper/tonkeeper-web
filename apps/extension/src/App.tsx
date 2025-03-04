import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { localizationFrom } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig, Network } from '@tonkeeper/core/dist/entries/network';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
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
import { AmplitudeAnalyticsContext, useTrackLocation } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { AppContext, IAppContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import { AppSdkContext } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useLock } from '@tonkeeper/uikit/dist/hooks/lock';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import {
    I18nContext,
    TranslationContext,
    useTWithReplaces
} from '@tonkeeper/uikit/dist/hooks/translation';
import { AppRoute, SettingsRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import Initialize, { InitializeContainer } from '@tonkeeper/uikit/dist/pages/import/Initialize';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { useUserFiatQuery } from '@tonkeeper/uikit/dist/state/fiat';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useActiveAccountQuery, useAccountsStateQuery } from '@tonkeeper/uikit/dist/state/wallet';
import { Container, GlobalStyle } from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, { FC, PropsWithChildren, Suspense, useCallback, useEffect, useMemo } from 'react';
import { MemoryRouter, Route, Switch, useLocation } from "react-router-dom";
import styled, { css } from 'styled-components';
import browser from 'webextension-polyfill';
import { Notifications } from './components/Notifications';
import { TonConnectSubscription } from './components/TonConnectSubscription';
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
import { useNavigate } from "@tonkeeper/uikit/dist/hooks/router/useNavigate";

const Settings = React.lazy(() => import('@tonkeeper/uikit/dist/pages/settings'));
const Browser = React.lazy(() => import('@tonkeeper/uikit/dist/pages/browser'));
const Activity = React.lazy(() => import('@tonkeeper/uikit/dist/pages/activity/Activity'));
const Home = React.lazy(() => import('@tonkeeper/uikit/dist/pages/home/Home'));
const Coin = React.lazy(() => import('@tonkeeper/uikit/dist/pages/coin/Coin'));
const SwapPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/swap'));
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

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

const sdk = new ExtensionAppSdk();
const TARGET_ENV = 'extension';
connectToBackground();

export const App: FC = () => {
    const browserT = useCallback((key: string) => browser.i18n.getMessage(key), []);
    const t = useTWithReplaces(browserT);

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
            <MemoryRouter>
                <InitialRedirect>
                    <AppSdkContext.Provider value={sdk}>
                        <StorageContext.Provider value={sdk.storage}>
                            <TranslationContext.Provider value={translation}>
                                <UserThemeProvider>
                                    <GlobalStyle />
                                    <HeaderGlobalStyle />
                                    <FooterGlobalStyle />
                                    <SybHeaderGlobalStyle />
                                    <GlobalListStyle />
                                    <Loader />
                                    <UnlockNotification sdk={sdk} />
                                </UserThemeProvider>
                            </TranslationContext.Provider>
                        </StorageContext.Provider>
                    </AppSdkContext.Provider>
                </InitialRedirect>
            </MemoryRouter>
        </QueryClientProvider>
    );
};

const PageWrapper = styled(Container)`
    min-width: 385px;

    > * {
        overflow: auto;
        width: var(--app-width);
        max-width: 548px;
        box-sizing: border-box;
    }
`;

const FullSizeWrapper = styled(Container)<{ standalone: boolean }>`
    min-width: 385px;
    height: 600px;

    > * {
        ${props =>
            props.standalone &&
            css`
                overflow: auto;
                width: var(--app-width);
                max-width: 548px;
                box-sizing: border-box;
            `}
    }
`;

const Wrapper = styled(FullSizeWrapper)<{
    standalone: boolean;
    recovery: boolean;
}>`
    box-sizing: border-box;
    padding-top: ${props => (props.recovery ? 0 : 64)}px;
    padding-bottom: 80px;
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
        targetEnv: TARGET_ENV,
        build: sdk.version,
        lang: localizationFrom(browser.i18n.getUILanguage())
    });
    const { data: serverConfig } = useTonenpointConfig(tonendpoint);

    const { data: tracker } = useAnalytics(
        sdk.storage,
        activeAccount || undefined,
        accounts,
        sdk.version
    );

    if (
        activeWalletLoading ||
        isWalletsLoading ||
        !serverConfig ||
        lock === undefined ||
        fiat === undefined ||
        !devSettings ||
        globalPreferencesLoading ||
        globalSetupLoading
    ) {
        return (
            <FullSizeWrapper standalone={false}>
                <Loading />
            </FullSizeWrapper>
        );
    }

    const context: IAppContext = {
        mainnetApi: getApiConfig(serverConfig.mainnetConfig, Network.MAINNET),
        testnetApi: getApiConfig(serverConfig.testnetConfig, Network.TESTNET),
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
        hideMam: true,
        hideMultisig: true,
        defaultWalletVersion: WalletVersion.V5R1,
        env: {
          tronApiKey: process.env.REACT_APP_TRON_API_KEY
        }
    };

    return (
        <AmplitudeAnalyticsContext.Provider value={tracker}>
            <AppContext.Provider value={context}>
                <Content activeAccount={activeAccount} lock={lock} />
                <CopyNotification />
                <Suspense fallback={<></>}>
                    <QrScanner />
                </Suspense>
                <ModalsRoot />
            </AppContext.Provider>
        </AmplitudeAnalyticsContext.Provider>
    );
});

const InitialRedirect: FC<PropsWithChildren> = ({ children }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (window.location.hash) {
            navigate(window.location.hash.substring(1));
        }
    }, []);

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
    useDebuggingTools();

    if (lock) {
        return (
            <FullSizeWrapper standalone>
                <Unlock />
            </FullSizeWrapper>
        );
    }

    if (pageView) {
        return (
            <PageWrapper>
                <Suspense fallback={<Loading />}>
                    <InitializeContainer>
                        <Initialize />
                    </InitializeContainer>
                </Suspense>
            </PageWrapper>
        );
    }

    return (
        <Wrapper standalone recovery={location.pathname.includes(SettingsRoute.recovery)}>
            <Switch>
                <Route
                    path={AppRoute.activity}
                >
                    <Suspense fallback={<ActivitySkeletonPage />}>
                    <Activity />
                 </Suspense>
                </Route>
                <Route
                    path={AppRoute.browser}
                >
                    <Suspense fallback={<BrowserSkeletonPage />}>
                        <Browser />
                    </Suspense>
                </Route>
                <Route
                    path={AppRoute.settings}
                >
                    <Suspense fallback={<SettingsSkeletonPage />}>
                        <Settings />
                    </Suspense>
                </Route>
                <Route path={`${AppRoute.coins}/:name`}>
                    <Suspense fallback={<CoinSkeletonPage />}>
                        <Coin />
                    </Suspense>
                </Route>
                <Route
                    path={AppRoute.swap}
                >
                    <Suspense fallback={null}>
                        <SwapPage />
                    </Suspense>
                </Route>
                <Route path="*" component={IndexPage} />
            </Switch>
            <Footer />
            <MemoryScroll />
            <TonConnectSubscription />
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
        </Wrapper>
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
            <Notifications />
        </>
    );
};
