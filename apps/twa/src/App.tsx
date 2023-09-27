import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
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
    ActivitySkeletonPage,
    CoinSkeletonPage,
    HomeSkeleton,
    SettingsSkeletonPage
} from '@tonkeeper/uikit/dist/components/Skeleton';
import { SybHeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/SubHeader';
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
import { AppRoute, any } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';

import {
    AmplitudeAnalyticsContext,
    useAmplitudeAnalytics
} from '@tonkeeper/uikit/dist/hooks/amplitude';
import { defaultTheme } from '@tonkeeper/uikit/dist/styles/defaultTheme';
import { lightTheme } from '@tonkeeper/uikit/dist/styles/lightTheme';

import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';

import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { useAccountState } from '@tonkeeper/uikit/dist/state/account';
import { useAuthState } from '@tonkeeper/uikit/dist/state/password';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import { Container } from '@tonkeeper/uikit/dist/styles/globalStyle';
import { Platform as TwaPlatform, WebApp } from '@twa.js/sdk';
import { SDKProvider, useSDK, useWebApp } from '@twa.js/sdk-react';
import React, { FC, PropsWithChildren, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { InitDataLogger } from './components/InitData';
import { TwaReceiveNotification } from './components/ReceiveNotifications';
import { TwaQrScanner } from './components/TwaQrScanner';
import { TwaNftNotification } from './components/nft/NftNotification';
import { TwaSendNotification } from './components/transfer/SendNotifications';
import { TwaAppSdk } from './libs/appSdk';
import { useTwaAppViewport } from './libs/hooks';

const Initialize = React.lazy(() => import('@tonkeeper/uikit/dist/pages/import/Initialize'));
const ImportRouter = React.lazy(() => import('@tonkeeper/uikit/dist/pages/import'));
const Settings = React.lazy(() => import('@tonkeeper/uikit/dist/pages/settings'));
const Activity = React.lazy(() => import('@tonkeeper/uikit/dist/pages/activity/Activity'));
const Home = React.lazy(() => import('@tonkeeper/uikit/dist/pages/home/Home'));
const Coin = React.lazy(() => import('@tonkeeper/uikit/dist/pages/coin/Coin'));
const TonConnectSubscription = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/connect/TonConnectSubscription')
);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

export const App = () => {
    return (
        <SDKProvider>
            <TwaLoader />
        </SDKProvider>
    );
};

const TwaLoader = () => {
    const { didInit, components, error } = useSDK();

    const sdk = useMemo(() => {
        if (!components) return undefined;
        return new TwaAppSdk(components);
    }, [components]);

    useEffect(() => {
        if (!components) return undefined;

        const theme = components.themeParams.isDark ? defaultTheme : lightTheme;

        components.webApp.setBackgroundColor((theme as any).backgroundPage);
        components.webApp.setHeaderColor((theme as any).backgroundPage);
        components.mainButton.setBackgroundColor((theme as any).buttonPrimaryBackground);
        components.mainButton.setTextColor((theme as any).buttonPrimaryForeground);
    }, [components?.themeParams.isDark]);

    if (error instanceof Error) {
        return <div>{error.message}</div>;
    }

    if (!didInit || components == null || sdk == null) {
        return <></>;
    }

    return (
        <AppSdkContext.Provider value={sdk}>
            <QueryClientProvider client={queryClient}>
                <UserThemeProvider isDark={components.themeParams.isDark}>
                    <TwaApp sdk={sdk} webApp={components.webApp} />
                </UserThemeProvider>
            </QueryClientProvider>
        </AppSdkContext.Provider>
    );
};

const getMainButtonHeight = (platform: TwaPlatform): number | undefined => {
    switch (platform) {
        case 'ios':
            return 60;
        case 'android':
        case 'android_x':
            return undefined;
        default:
            return undefined;
    }
};

const TwaApp: FC<{ sdk: IAppSdk; webApp: WebApp }> = ({ sdk, webApp }) => {
    const { t, i18n } = useTranslation();

    const translation = useMemo(() => {
        const client: I18nContext = {
            t,
            i18n: {
                enable: false,
                reloadResources: i18n.reloadResources,
                changeLanguage: i18n.changeLanguage as any,
                language: i18n.language,
                languages: []
            }
        };
        return client;
    }, [t, i18n]);

    return (
        <BrowserRouter>
            <Suspense>
                <TranslationContext.Provider value={translation}>
                    <StorageContext.Provider value={sdk.storage}>
                        <HeaderGlobalStyle />
                        <FooterGlobalStyle />
                        <SybHeaderGlobalStyle />
                        <GlobalListStyle />
                        <InitDataLogger />
                        <Loader sdk={sdk} />
                        <UnlockNotification
                            sdk={sdk}
                            delta={getMainButtonHeight(webApp.platform)}
                        />
                    </StorageContext.Provider>
                </TranslationContext.Provider>
            </Suspense>
        </BrowserRouter>
    );
};

const FullSizeWrapper = styled(Container)``;

const Wrapper = styled(FullSizeWrapper)`
    height: var(--app-height);
    transition: height 0.4s ease;

    box-sizing: border-box;
    padding-top: 64px;
`;

const seeIfShowQrScanner = (platform: TwaPlatform): boolean => {
    switch (platform) {
        case 'ios':
        case 'android':
        case 'android_x':
            return true;
        default:
            return false;
    }
};

export const Loader: FC<{ sdk: IAppSdk }> = ({ sdk }) => {
    const { data: activeWallet } = useActiveWallet();
    const webApp = useWebApp();

    const lock = useLock(sdk);
    const { data: account } = useAccountState();
    const { data: auth } = useAuthState();

    const tonendpoint = useTonendpoint(sdk.version, activeWallet?.network, activeWallet?.lang);
    const { data: config } = useTonenpointConfig(tonendpoint);

    const navigate = useNavigate();
    const enable = useAmplitudeAnalytics('Twa', account, activeWallet);

    if (auth === undefined || account === undefined || config === undefined || lock === undefined) {
        return <Loading />;
    }

    const showQrScan = seeIfShowQrScanner(webApp.platform);

    const network = activeWallet?.network ?? Network.MAINNET;
    const fiat = activeWallet?.fiat ?? FiatCurrencies.USD;
    const context: IAppContext = {
        api: getApiConfig(config, network),
        auth,
        fiat,
        account,
        config,
        tonendpoint,
        standalone: false,
        extension: false,
        ios: true,
        hideQrScanner: !showQrScan
    };

    return (
        <AmplitudeAnalyticsContext.Provider value={enable}>
            <OnImportAction.Provider value={navigate}>
                <AfterImportAction.Provider
                    value={() => navigate(AppRoute.home, { replace: true })}
                >
                    <AppContext.Provider value={context}>
                        {/* <div
                                onClick={() => sdk.copyToClipboard(window.location.hash.slice(1))}
                                style={{
                                    paddingTop: '100px',
                                    minHeight: '200px',
                                    width: '200px',
                                    position: 'fixed',
                                    zIndex: '100',
                                    color: 'white'
                                }}
                            >
                                {components.initDataRaw}
                                {components.initData?.startParam}
                                {window.location.hash.slice(1)}
                            </div> */}
                        <Content activeWallet={activeWallet} lock={lock} showQrScan={showQrScan} />
                        <CopyNotification />
                        {showQrScan && <TwaQrScanner />}
                    </AppContext.Provider>
                </AfterImportAction.Provider>
            </OnImportAction.Provider>
        </AmplitudeAnalyticsContext.Provider>
    );
};

const InitWrapper = styled(Container)`
    height: var(--app-height);
    min-height: auto;

    transition: height 0.4s ease;

    overflow: auto;
    display: flex;
    flex-direction: column;
    padding: 16px;
    box-sizing: border-box;
    position: relative;
`;

const InitPages = () => {
    useTwaAppViewport(true);
    return (
        <InitWrapper>
            <Suspense fallback={<Loading />}>
                <Routes>
                    <Route path={any(AppRoute.import)} element={<ImportRouter />} />
                    <Route path="*" element={<Initialize />} />
                </Routes>
            </Suspense>
        </InitWrapper>
    );
};

const Content: FC<{
    activeWallet?: WalletState | null;
    lock: boolean;
    showQrScan: boolean;
}> = ({ activeWallet, lock, showQrScan }) => {
    const location = useLocation();
    useWindowsScroll();

    if (lock) {
        return (
            <FullSizeWrapper>
                <Unlock />
            </FullSizeWrapper>
        );
    }

    if (!activeWallet || location.pathname.startsWith(AppRoute.import)) {
        return <InitPages />;
    }

    return (
        <WalletStateContext.Provider value={activeWallet}>
            <MainPages showQrScan={showQrScan} />
        </WalletStateContext.Provider>
    );
};

const TwaNotification: FC<PropsWithChildren> = ({ children }) => {
    return (
        <TwaNftNotification>
            <TwaReceiveNotification>
                <TwaSendNotification>{children}</TwaSendNotification>
            </TwaReceiveNotification>
        </TwaNftNotification>
    );
};

const MainPages: FC<{ showQrScan: boolean }> = ({ showQrScan }) => {
    useTwaAppViewport(false);
    return (
        <TwaNotification>
            <Wrapper>
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
                    <Route
                        path="*"
                        element={
                            <>
                                <Header showQrScan={showQrScan} />
                                <InnerBody>
                                    <Suspense fallback={<HomeSkeleton />}>
                                        <Home />
                                    </Suspense>
                                </InnerBody>
                            </>
                        }
                    />
                </Routes>
                <Footer sticky />
                <MemoryScroll />
                <Suspense>
                    <TonConnectSubscription />
                </Suspense>
            </Wrapper>
        </TwaNotification>
    );
};
