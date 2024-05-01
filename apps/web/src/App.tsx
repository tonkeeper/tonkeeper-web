import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { AppContext, WalletStateContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import {
    AfterImportAction,
    AppSdkContext,
    OnImportAction
} from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useLock } from '@tonkeeper/uikit/dist/hooks/lock';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import { I18nContext, TranslationContext } from '@tonkeeper/uikit/dist/hooks/translation';
import { AppRoute, SignerRoute, any } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import Initialize, { InitializeContainer } from '@tonkeeper/uikit/dist/pages/import/Initialize';
import { useKeyboardHeight } from '@tonkeeper/uikit/dist/pages/import/hooks';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { useAccountState } from '@tonkeeper/uikit/dist/state/account';
import { useUserFiat } from '@tonkeeper/uikit/dist/state/fiat';
import { useAuthState } from '@tonkeeper/uikit/dist/state/password';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import { Container, GlobalStyle } from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, { FC, PropsWithChildren, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { BrowserAppSdk } from './libs/appSdk';
import { useAnalytics, useAppHeight, useAppWidth } from './libs/hooks';

const ImportRouter = React.lazy(() => import('@tonkeeper/uikit/dist/pages/import'));
const Settings = React.lazy(() => import('@tonkeeper/uikit/dist/pages/settings'));
const Browser = React.lazy(() => import('@tonkeeper/uikit/dist/pages/browser'));
const Activity = React.lazy(() => import('@tonkeeper/uikit/dist/pages/activity/Activity'));
const Home = React.lazy(() => import('@tonkeeper/uikit/dist/pages/home/Home'));
const Coin = React.lazy(() => import('@tonkeeper/uikit/dist/pages/coin/Coin'));
const QrScanner = React.lazy(() => import('@tonkeeper/uikit/dist/components/QrScanner'));
const TonConnectSubscription = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/connect/TonConnectSubscription')
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
const SignerLinkPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/signer/LinkPage'));
const SignerPublishNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/pages/signer/PublishNotification')
);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

const sdk = new BrowserAppSdk();
const TARGET_ENV = 'web';

export const App: FC<PropsWithChildren> = () => {
    const { t, i18n } = useTranslation();

    const translation = useMemo(() => {
        const languages = (import.meta.env.VITE_APP_LOCALES ?? 'en').split(',');
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
                                    <GlobalStyle />
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

const FullSizeWrapper = styled(Container)<{ standalone: boolean }>`
    ${props =>
        props.standalone
            ? css`
                  position: fixed;
                  top: 0;
                  height: calc(var(--app-height) - 2px);
                  -webkit-overflow-scrolling: touch;
              `
            : css`
                  @media (min-width: 600px) {
                      border-left: 1px solid ${props.theme.separatorCommon};
                      border-right: 1px solid ${props.theme.separatorCommon};
                  }
              `};

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

const Wrapper = styled(FullSizeWrapper)<{ standalone: boolean }>`
    box-sizing: border-box;
    padding-top: 64px;
    padding-bottom: ${props => (props.standalone ? '96' : '80')}px;
`;

export const Loader: FC = () => {
    const { data: activeWallet } = useActiveWallet();
    const { data: fiat } = useUserFiat();

    const [ios, standalone] = useMemo(() => {
        return [sdk.isIOs(), sdk.isStandalone()] as const;
    }, []);

    const lock = useLock(sdk);
    const { i18n } = useTranslation();
    const { data: account } = useAccountState();
    const { data: auth } = useAuthState();

    const tonendpoint = useTonendpoint(
        TARGET_ENV,
        sdk.version,
        activeWallet?.network,
        activeWallet?.lang
    );
    const { data: config } = useTonenpointConfig(tonendpoint);

    const navigate = useNavigate();
    useAppHeight();

    const { data: tracker } = useAnalytics(account, activeWallet, sdk.version);

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

    if (
        auth === undefined ||
        account === undefined ||
        config === undefined ||
        lock === undefined ||
        fiat === undefined
    ) {
        return <Loading />;
    }

    const network = activeWallet?.network ?? Network.MAINNET;
    const context = {
        api: getApiConfig(config, network),
        auth,
        fiat,
        account,
        config,
        tonendpoint,
        standalone,
        extension: false,
        proFeatures: false,
        ios
    };

    return (
        <AmplitudeAnalyticsContext.Provider value={tracker}>
            <OnImportAction.Provider value={navigate}>
                <AfterImportAction.Provider
                    value={() => navigate(AppRoute.home, { replace: true })}
                >
                    <AppContext.Provider value={context}>
                        <Content activeWallet={activeWallet} lock={lock} standalone={standalone} />
                        <CopyNotification hideSimpleCopyNotifications={!standalone} />
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
    standalone: boolean;
}> = ({ activeWallet, lock, standalone }) => {
    const location = useLocation();
    useWindowsScroll();
    useAppWidth(standalone);
    useKeyboardHeight();
    useTrackLocation();

    if (lock) {
        return (
            <FullSizeWrapper standalone={standalone}>
                <Unlock />
            </FullSizeWrapper>
        );
    }

    if (location.pathname.startsWith(AppRoute.signer)) {
        return (
            <Wrapper standalone={standalone}>
                <Routes>
                    <Route path={AppRoute.signer}>
                        <Route
                            path={SignerRoute.link}
                            element={
                                <Suspense>
                                    <SignerLinkPage />
                                </Suspense>
                            }
                        />
                    </Route>
                </Routes>
            </Wrapper>
        );
    }

    if (!activeWallet || location.pathname.startsWith(AppRoute.import)) {
        return (
            <FullSizeWrapper standalone={false}>
                <Suspense fallback={<Loading />}>
                    <InitializeContainer fullHeight={false}>
                        <Routes>
                            <Route
                                path={any(AppRoute.import)}
                                element={<ImportRouter listOfAuth={[]} />}
                            />
                            <Route path="*" element={<Initialize />} />
                        </Routes>
                    </InitializeContainer>
                </Suspense>
            </FullSizeWrapper>
        );
    }

    return (
        <Wrapper standalone={standalone}>
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
                <Footer standalone={standalone} />
                <MemoryScroll />
                <Suspense>
                    <SendActionNotification />
                    <ReceiveNotification />
                    <TonConnectSubscription />
                    <NftNotification />
                    <SendNftNotification />
                    <AddFavoriteNotification />
                    <EditFavoriteNotification />
                    <PairSignerNotification />
                    <SignerPublishNotification />
                </Suspense>
            </WalletStateContext.Provider>
        </Wrapper>
    );
};
