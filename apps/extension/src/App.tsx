import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { localizationFrom } from '@tonkeeper/core/dist/entries/language';
import { Network, getApiConfig } from '@tonkeeper/core/dist/entries/network';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { InnerBody, useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { Footer, FooterGlobalStyle } from '@tonkeeper/uikit/dist/components/Footer';
import { Header, HeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/Header';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import MemoryScroll from '@tonkeeper/uikit/dist/components/MemoryScroll';
import {
    ActivitySkeletonPage, BrowserSkeletonPage,
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
import {
    AppContext,
    IAppContext,
    WalletStateContext
} from '@tonkeeper/uikit/dist/hooks/appContext';
import {
    AfterImportAction,
    AppSdkContext,
    OnImportAction
} from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useLock } from '@tonkeeper/uikit/dist/hooks/lock';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import { I18nContext, TranslationContext } from '@tonkeeper/uikit/dist/hooks/translation';
import { AppRoute, SettingsRoute, any } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import Initialize, { InitializeContainer } from '@tonkeeper/uikit/dist/pages/import/Initialize';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { useAccountState } from '@tonkeeper/uikit/dist/state/account';
import { useAuthState } from '@tonkeeper/uikit/dist/state/password';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import {Container, GlobalStyle} from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, { FC, PropsWithChildren, Suspense, useEffect, useMemo } from 'react';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import browser from 'webextension-polyfill';
import { Notifications } from './components/Notifications';
import { connectToBackground } from './event';
import { ExtensionAppSdk } from './libs/appSdk';
import { useAnalytics, useAppWidth } from './libs/hoolks';

const ImportRouter = React.lazy(() => import('@tonkeeper/uikit/dist/pages/import'));
const Settings = React.lazy(() => import('@tonkeeper/uikit/dist/pages/settings'));
const Browser = React.lazy(() => import('@tonkeeper/uikit/dist/pages/browser'));
const Activity = React.lazy(() => import('@tonkeeper/uikit/dist/pages/activity/Activity'));
const Home = React.lazy(() => import('@tonkeeper/uikit/dist/pages/home/Home'));
const Coin = React.lazy(() => import('@tonkeeper/uikit/dist/pages/coin/Coin'));
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

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false
        }
    }
});

const sdk = new ExtensionAppSdk();
const TARGET_ENV = 'extension';
connectToBackground();

export const App: FC = () => {
    const translation = useMemo(() => {
        const client: I18nContext = {
            t: browser.i18n.getMessage,
            i18n: {
                enable: false,
                reloadResources: async () => {},
                changeLanguage: async () => {},
                language: browser.i18n.getUILanguage(),
                languages: []
            }
        };
        return client;
    }, []);

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
    const { data: activeWallet } = useActiveWallet();

    const lock = useLock(sdk);
    const { data: account } = useAccountState();
    const { data: auth } = useAuthState();
    const tonendpoint = useTonendpoint(
        TARGET_ENV,
        sdk.version,
        activeWallet?.network,
        localizationFrom(browser.i18n.getUILanguage())
    );
    const { data: config } = useTonenpointConfig(tonendpoint);

    const { data: tracker } = useAnalytics(sdk.storage, account, activeWallet);

    if (!account || !auth || !config || lock === undefined) {
        return (
            <FullSizeWrapper standalone={false}>
                <Loading />
            </FullSizeWrapper>
        );
    }

    const network = activeWallet?.network ?? Network.MAINNET;
    const fiat = activeWallet?.fiat ?? FiatCurrencies.USD;

    const context: IAppContext = {
        api: getApiConfig(config, network),
        account,
        auth,
        fiat,
        config,
        tonendpoint,
        ios: false,
        standalone: true,
        extension: true,
        hideQrScanner: true
    };

    return (
        <AmplitudeAnalyticsContext.Provider value={tracker}>
            <OnImportAction.Provider value={sdk.openExtensionInBrowser}>
                <AfterImportAction.Provider value={sdk.closeExtensionInBrowser}>
                    <AppContext.Provider value={context}>
                        <Content activeWallet={activeWallet} lock={lock} />
                        <CopyNotification />
                    </AppContext.Provider>
                </AfterImportAction.Provider>
            </OnImportAction.Provider>
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
    activeWallet?: WalletState | null;
    lock: boolean;
}> = ({ activeWallet, lock }) => {
    const location = useLocation();

    const pageView = !activeWallet || location.pathname.startsWith(AppRoute.import);

    useWindowsScroll(!pageView);
    useAppWidth();
    useTrackLocation();

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
                    <Routes>
                        <Route
                            path={any(AppRoute.import)}
                            element={
                                <InitializeContainer fullHeight={false}>
                                    <ImportRouter listOfAuth={[]} />
                                </InitializeContainer>
                            }
                        />
                        <Route
                            path="*"
                            element={
                                <InitializeContainer>
                                    <Initialize />
                                </InitializeContainer>
                            }
                        />
                    </Routes>
                </Suspense>
            </PageWrapper>
        );
    }

    return (
        <Wrapper standalone recovery={location.pathname.includes(SettingsRoute.recovery)}>
            <WalletStateContext.Provider value={activeWallet}>
                <Routes>
                    <Route
                        path={AppRoute.activity}
                        element={
                            <Suspense fallback={<ActivitySkeletonPage />}>
                                <Activity />
                            </Suspense>
                        }
                    />
                    <Route
                        path={any(AppRoute.browser)}
                        element={
                            <Suspense fallback={<BrowserSkeletonPage />}>
                                <Browser />
                            </Suspense>
                        }
                    />
                    <Route
                        path={any(AppRoute.settings)}
                        element={
                            <Suspense fallback={<SettingsSkeletonPage />}>
                                <Settings />
                            </Suspense>
                        }
                    />
                    <Route path={AppRoute.coins}>
                        <Route
                            path=":name/*"
                            element={
                                <Suspense fallback={<CoinSkeletonPage />}>
                                    <Coin />
                                </Suspense>
                            }
                        />
                    </Route>
                    <Route path="*" element={<IndexPage />} />
                </Routes>
                <Footer />
                <MemoryScroll />
                <Suspense>
                    <SendActionNotification />
                    <ReceiveNotification />
                    <NftNotification />
                    <SendNftNotification />
                    <AddFavoriteNotification />
                    <EditFavoriteNotification />
                </Suspense>
            </WalletStateContext.Provider>
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
