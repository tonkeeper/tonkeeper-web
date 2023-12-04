import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
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
    AddFavoriteNotification,
    EditFavoriteNotification
} from '@tonkeeper/uikit/dist/components/transfer/FavoriteNotification';
import {
    AmplitudeAnalyticsContext,
    useAmplitudeAnalytics
} from '@tonkeeper/uikit/dist/hooks/amplitude';
import { AppContext, WalletStateContext } from '@tonkeeper/uikit/dist/hooks/appContext';
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
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import Initialize, { InitializeContainer } from '@tonkeeper/uikit/dist/pages/import/Initialize';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { useAccountState } from '@tonkeeper/uikit/dist/state/account';
import { useAuthState } from '@tonkeeper/uikit/dist/state/password';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import { Container } from '@tonkeeper/uikit/dist/styles/globalStyle';
import { FC, PropsWithChildren, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { DesktopAppSdk } from './libs/appSdk';
import { useAppHeight, useAppWidth } from './libs/hooks';

import QrScanner from '@tonkeeper/uikit/dist/components/QrScanner';
import TonConnectSubscription from '@tonkeeper/uikit/dist/components/connect/TonConnectSubscription';
import ReceiveNotification from '@tonkeeper/uikit/dist/components/home/ReceiveNotification';
import NftNotification from '@tonkeeper/uikit/dist/components/nft/NftNotification';
import SendActionNotification from '@tonkeeper/uikit/dist/components/transfer/SendNotifications';
import SendNftNotification from '@tonkeeper/uikit/dist/components/transfer/nft/SendNftNotification';
import Activity from '@tonkeeper/uikit/dist/pages/activity/Activity';
import Coin from '@tonkeeper/uikit/dist/pages/coin/Coin';
import Home from '@tonkeeper/uikit/dist/pages/home/Home';
import ImportRouter from '@tonkeeper/uikit/dist/pages/import';
import Settings from '@tonkeeper/uikit/dist/pages/settings';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

const sdk = new DesktopAppSdk();

const langs = 'en,zh_CN,ru,it,tr';

export const App: FC<PropsWithChildren> = () => {
    const { t, i18n } = useTranslation();

    const translation = useMemo(() => {
        const languages = langs.split(',');
        const client: I18nContext = {
            t,
            i18n: {
                enable: true,
                reloadResources: i18n.reloadResources,
                changeLanguage: i18n.changeLanguage as any,
                language: i18n.language,
                languages: languages
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
                            <StorageContext.Provider value={sdk.storage}>
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

const FullSizeWrapper = styled(Container)``;

const Wrapper = styled(FullSizeWrapper)`
    box-sizing: border-box;
    padding-top: 64px;
    padding-bottom: 80px;
`;

export const Loader: FC = () => {
    const { data: activeWallet } = useActiveWallet();

    const lock = useLock(sdk);
    const { i18n } = useTranslation();
    const { data: account } = useAccountState();
    const { data: auth } = useAuthState();

    const tonendpoint = useTonendpoint(sdk.version, activeWallet?.network, activeWallet?.lang);
    const { data: config } = useTonenpointConfig(tonendpoint);

    const navigate = useNavigate();
    useAppHeight();

    const enable = useAmplitudeAnalytics('Desktop', account, activeWallet);

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

    if (auth === undefined || account === undefined || config === undefined || lock === undefined) {
        return <Loading />;
    }

    const network = activeWallet?.network ?? Network.MAINNET;
    const fiat = activeWallet?.fiat ?? FiatCurrencies.USD;
    const context = {
        api: getApiConfig(config, network),
        auth,
        fiat,
        account,
        config,
        tonendpoint,
        standalone: false,
        extension: false,
        ios: false
    };

    return (
        <AmplitudeAnalyticsContext.Provider value={enable}>
            <OnImportAction.Provider value={navigate}>
                <AfterImportAction.Provider
                    value={() => navigate(AppRoute.home, { replace: true })}
                >
                    <AppContext.Provider value={context}>
                        <Content activeWallet={activeWallet} lock={lock} />
                        <CopyNotification />
                        <Suspense fallback={<></>}>
                            <QrScanner />
                        </Suspense>
                    </AppContext.Provider>
                </AfterImportAction.Provider>
            </OnImportAction.Provider>
        </AmplitudeAnalyticsContext.Provider>
    );
};

export const Content: FC<{
    activeWallet?: WalletState | null;
    lock: boolean;
}> = ({ activeWallet, lock }) => {
    const location = useLocation();
    useWindowsScroll();
    useAppWidth();

    if (lock) {
        return (
            <FullSizeWrapper>
                <Unlock />
            </FullSizeWrapper>
        );
    }

    if (!activeWallet || location.pathname.startsWith(AppRoute.import)) {
        return (
            <FullSizeWrapper>
                <Suspense fallback={<Loading />}>
                    <InitializeContainer fullHeight={false}>
                        <Routes>
                            <Route path={any(AppRoute.import)} element={<ImportRouter />} />
                            <Route path="*" element={<Initialize />} />
                        </Routes>
                    </InitializeContainer>
                </Suspense>
            </FullSizeWrapper>
        );
    }

    return (
        <Wrapper>
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
                                <Header />
                                <InnerBody>
                                    <Suspense fallback={<HomeSkeleton />}>
                                        <Home />
                                    </Suspense>
                                </InnerBody>
                            </>
                        }
                    />
                </Routes>
                <Footer standalone={false} />
                <MemoryScroll />
                <Suspense>
                    <SendActionNotification />
                    <ReceiveNotification />
                    <TonConnectSubscription />
                    <NftNotification />
                    <SendNftNotification />
                    <AddFavoriteNotification />
                    <EditFavoriteNotification />
                </Suspense>
            </WalletStateContext.Provider>
        </Wrapper>
    );
};
