import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { languages, localizationText } from '@tonkeeper/core/dist/entries/language';
import {
    Network,
    getTonClient,
    getTonClientV2,
    getTronClient
} from '@tonkeeper/core/dist/entries/network';
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
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import { I18nContext, TranslationContext } from '@tonkeeper/uikit/dist/hooks/translation';
import { AppRoute, any } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';

import { defaultTheme } from '@tonkeeper/uikit';
import {
    AmplitudeAnalyticsContext,
    useAmplitudeAnalytics
} from '@tonkeeper/uikit/dist/hooks/amplitude';

import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import { Initialize } from '@tonkeeper/uikit/dist/pages/import/Initialize';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { useAccountState } from '@tonkeeper/uikit/dist/state/account';
import { useAuthState } from '@tonkeeper/uikit/dist/state/password';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import { Container } from '@tonkeeper/uikit/dist/styles/globalStyle';
import { Platform as TwaPlatform } from '@twa.js/sdk';
import { SDKProvider, useSDK } from '@twa.js/sdk-react';
import React, { FC, Suspense, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { InitDataLogger } from './components/InitData';
import { TwaQrScanner } from './components/TwaQrScanner';
import { SendAction } from './components/transfer/SendNotifications';
import { TwaAppSdk } from './libs/appSdk';
import { ViewportContext, useTwaAppViewport } from './libs/hooks';
import { BrowserStorage } from './libs/storage';

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
const storage = new BrowserStorage();
const sdk = new TwaAppSdk(storage);

export const App = () => {
    return (
        <SDKProvider>
            <TwaApp />
        </SDKProvider>
    );
};

const TwaApp = () => {
    const { t, i18n } = useTranslation();

    const translation = useMemo(() => {
        const client: I18nContext = {
            t,
            i18n: {
                enable: true,
                reloadResources: i18n.reloadResources,
                changeLanguage: i18n.changeLanguage as any,
                language: i18n.language,
                languages: [...languages].map(localizationText)
            }
        };
        return client;
    }, [t, i18n]);

    return (
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <Suspense fallback={<div></div>}>
                    <AppSdkContext.Provider value={sdk}>
                        <TranslationContext.Provider value={translation}>
                            <StorageContext.Provider value={storage}>
                                <UserThemeProvider>
                                    <HeaderGlobalStyle />
                                    <FooterGlobalStyle />
                                    <SybHeaderGlobalStyle />
                                    <GlobalListStyle />
                                    <Loader />
                                    <UnlockNotification sdk={sdk} />
                                </UserThemeProvider>
                            </StorageContext.Provider>
                        </TranslationContext.Provider>
                    </AppSdkContext.Provider>
                </Suspense>
            </QueryClientProvider>
        </BrowserRouter>
    );
};

const useLock = () => {
    const [lock, setLock] = useState<boolean | undefined>(undefined);
    useEffect(() => {
        sdk.storage.get<boolean>(AppKey.LOCK).then(useLock => setLock(useLock === true));

        const unlock = () => {
            setLock(false);
        };
        sdk.uiEvents.on('unlock', unlock);

        return () => {
            sdk.uiEvents.off('unlock', unlock);
        };
    }, []);
    return lock;
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

export const Loader: FC = () => {
    const { data: activeWallet } = useActiveWallet();

    const { didInit, components } = useSDK();
    const lock = useLock();
    const { i18n } = useTranslation();
    const { data: account } = useAccountState();
    const { data: auth } = useAuthState();

    const tonendpoint = useTonendpoint(sdk.version, activeWallet?.network, activeWallet?.lang);
    const { data: config } = useTonenpointConfig(tonendpoint);

    const navigate = useNavigate();
    const enable = useAmplitudeAnalytics('Twa', account, activeWallet);

    useEffect(() => {
        if (
            activeWallet &&
            activeWallet.lang &&
            i18n.language !== localizationText(activeWallet.lang)
        ) {
            i18n.reloadResources([localizationText(activeWallet.lang)]).then(() =>
                i18n.changeLanguage(localizationText(activeWallet.lang))
            );
        }
    }, [activeWallet, i18n]);

    useEffect(() => {
        if (components) {
            sdk.setTwaExpand(() => {
                components.viewport.expand();
                return undefined;
            });

            sdk.setHapticFeedback(components.haptic);
            components.webApp.setBackgroundColor((defaultTheme as any).backgroundPage);
        }
    }, [components]);

    if (
        auth === undefined ||
        account === undefined ||
        config === undefined ||
        lock === undefined ||
        !didInit ||
        components == null
    ) {
        return <Loading />;
    }

    const showQrScan = seeIfShowQrScanner(components.webApp.platform);
    const network = activeWallet?.network ?? Network.MAINNET;
    const fiat = activeWallet?.fiat ?? FiatCurrencies.USD;
    const context: IAppContext = {
        api: {
            tonApi: getTonClient(config, network),
            tonApiV2: getTonClientV2(config, network),
            tronApi: getTronClient(network)
        },
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
        <ViewportContext.Provider value={components.viewport}>
            <AmplitudeAnalyticsContext.Provider value={enable}>
                <OnImportAction.Provider value={navigate}>
                    <AfterImportAction.Provider
                        value={() => navigate(AppRoute.home, { replace: true })}
                    >
                        <AppContext.Provider value={context}>
                            <Content
                                activeWallet={activeWallet}
                                lock={lock}
                                showQrScan={showQrScan}
                            />
                            <CopyNotification />
                            {showQrScan && <TwaQrScanner />}
                            <InitDataLogger />
                        </AppContext.Provider>
                    </AfterImportAction.Provider>
                </OnImportAction.Provider>
            </AmplitudeAnalyticsContext.Provider>
        </ViewportContext.Provider>
    );
};

const InitWrapper = styled(Container)`
    height: var(--tg-viewport-stable-height);

    transition: height 0.4s ease;

    overflow: auto;
    display: flex;
    flex-direction: column;
    padding: 1rem 1rem;
    box-sizing: border-box;
    position: relative;
`;

const InitPages = () => {
    // useAppViewport();

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

export const Content: FC<{
    activeWallet?: WalletState | null;
    lock: boolean;
    showQrScan: boolean;
}> = ({ activeWallet, lock, showQrScan }) => {
    const location = useLocation();
    useWindowsScroll();
    useTwaAppViewport();

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
            <SendAction>
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
            </SendAction>
        </WalletStateContext.Provider>
    );
};
