import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { Network, getApiConfig } from '@tonkeeper/core/dist/entries/network';
import { AuthState } from '@tonkeeper/core/dist/entries/password';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import ConnectLedgerNotification from '@tonkeeper/uikit/dist/components/ConnectLedgerNotification';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { FooterGlobalStyle } from '@tonkeeper/uikit/dist/components/Footer';
import { HeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/Header';
import { DarkThemeContext } from '@tonkeeper/uikit/dist/components/Icon';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import MemoryScroll from '@tonkeeper/uikit/dist/components/MemoryScroll';
import PairSignerNotification from '@tonkeeper/uikit/dist/components/PairSignerNotification';
import QrScanner from '@tonkeeper/uikit/dist/components/QrScanner';
import { SybHeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/SubHeader';
import { AsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/AsideMenu';
import { PreferencesAsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/PreferencesAsideMenu';
import { WalletAsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/WalletAsideMenu';
import { DesktopHeader } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopHeader';
import ReceiveNotification from '@tonkeeper/uikit/dist/components/home/ReceiveNotification';
import NftNotification from '@tonkeeper/uikit/dist/components/nft/NftNotification';
import {
    AddFavoriteNotification,
    EditFavoriteNotification
} from '@tonkeeper/uikit/dist/components/transfer/FavoriteNotification';
import SendActionNotification from '@tonkeeper/uikit/dist/components/transfer/SendNotifications';
import SendNftNotification from '@tonkeeper/uikit/dist/components/transfer/nft/SendNftNotification';
import DesktopBrowser from '@tonkeeper/uikit/dist/desktop-pages/browser';
import { DesktopCoinPage } from '@tonkeeper/uikit/dist/desktop-pages/coin/DesktopCoinPage';
import DashboardPage from '@tonkeeper/uikit/dist/desktop-pages/dashboard';
import { DesktopHistoryPage } from '@tonkeeper/uikit/dist/desktop-pages/history/DesktopHistoryPage';
import { DesktopMultiSendPage } from '@tonkeeper/uikit/dist/desktop-pages/multi-send';
import { NotcoinPage } from '@tonkeeper/uikit/dist/desktop-pages/notcoin/NotcoinPage';
import { DesktopPreferencesRouting } from '@tonkeeper/uikit/dist/desktop-pages/preferences/DesktopPreferencesRouting';
import { DesktopPurchases } from '@tonkeeper/uikit/dist/desktop-pages/purchases/DesktopPurchases';
import { DesktopWalletSettingsRouting } from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopWalletSettingsRouting';
import { DesktopTokens } from '@tonkeeper/uikit/dist/desktop-pages/tokens/DesktopTokens';
import { AmplitudeAnalyticsContext, useTrackLocation } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { AppContext, WalletStateContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import {
    AfterImportAction,
    AppSdkContext,
    OnImportAction
} from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useRecommendations } from '@tonkeeper/uikit/dist/hooks/browser/useRecommendations';
import { useLock } from '@tonkeeper/uikit/dist/hooks/lock';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import { I18nContext, TranslationContext } from '@tonkeeper/uikit/dist/hooks/translation';
import { AppProRoute, AppRoute, any } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import ImportRouter from '@tonkeeper/uikit/dist/pages/import';
import Initialize, { InitializeContainer } from '@tonkeeper/uikit/dist/pages/import/Initialize';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { useAccountState } from '@tonkeeper/uikit/dist/state/account';
import { useUserFiat } from '@tonkeeper/uikit/dist/state/fiat';
import { useAuthState, useCanPromptTouchId } from '@tonkeeper/uikit/dist/state/password';
import { useProBackupState } from '@tonkeeper/uikit/dist/state/pro';
import { useStonfiAssets } from '@tonkeeper/uikit/dist/state/stonfi';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useActiveWallet } from '@tonkeeper/uikit/dist/state/wallet';
import { Container, GlobalStyleCss } from '@tonkeeper/uikit/dist/styles/globalStyle';
import { FC, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Outlet,
    Route,
    RouterProvider,
    Routes,
    createMemoryRouter,
    useLocation,
    useNavigate
} from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { DesktopAppSdk } from '../libs/appSdk';
import { useAnalytics, useAppHeight, useAppWidth } from '../libs/hooks';
import { DeepLinkSubscription } from './components/DeepLink';
import { TonConnectSubscription } from './components/TonConnectSubscription';
import SwapPage from "@tonkeeper/uikit/dist/pages/swap";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false
        }
    }
});

const GlobalStyle = createGlobalStyle`
    ${GlobalStyleCss};
    
    body {
        font-family: '-apple-system', BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, Tahoma, Verdana, 'sans-serif';
    }
    
    html, body, #root {
        height: 100%;
        overflow: hidden;
    }

    html.is-locked {
        height: var(--app-height);
    }

    button, input[type="submit"], input[type="reset"] {
      background: none;
      color: inherit;
      border: none;
      padding: 0;
      font: inherit;
      cursor: pointer;
      outline: inherit;
    }
`;

const sdk = new DesktopAppSdk();
const TARGET_ENV = 'desktop';

const langs = 'en,zh_CN,ru,it,tr';
const listOfAuth: AuthState['kind'][] = ['keychain'];

declare const REACT_APP_TONCONSOLE_API: string;
declare const REACT_APP_TG_BOT_ID: string;
declare const REACT_APP_STONFI_REFERRAL_ADDRESS: string;

export const Providers = () => {
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

    useEffect(() => {
        document.body.classList.add(window.backgroundApi.platform());
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <Suspense fallback={<div></div>}>
                <AppSdkContext.Provider value={sdk}>
                    <TranslationContext.Provider value={translation}>
                        <StorageContext.Provider value={sdk.storage}>
                            <ThemeAndContent />
                        </StorageContext.Provider>
                    </TranslationContext.Provider>
                </AppSdkContext.Provider>
            </Suspense>
        </QueryClientProvider>
    );
};

const router = createMemoryRouter([
    {
        path: '/*',
        element: <Providers />
    }
]);

export const App = () => {
    return <RouterProvider router={router} />;
};

const ThemeAndContent = () => {
    const { data } = useProBackupState();
    return (
        <UserThemeProvider displayType="full-width" isPro={data?.valid} isProSupported>
            <DarkThemeContext.Provider value={!data?.valid}>
                <GlobalStyle />
                <HeaderGlobalStyle />
                <FooterGlobalStyle />
                <SybHeaderGlobalStyle />
                <GlobalListStyle />
                <Loader />
                <UnlockNotification sdk={sdk} />
            </DarkThemeContext.Provider>
        </UserThemeProvider>
    );
};

const FullSizeWrapper = styled(Container)`
    max-width: 800px;
`;

const Wrapper = styled.div`
    box-sizing: border-box;

    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: ${props => props.theme.backgroundPage};
    white-space: pre-wrap;
`;

const WideLayout = styled.div`
    width: 100%;
    height: 100%;
    display: flex;
`;

const WideContent = styled.div`
    flex: 1;
    overflow: auto;
`;

const WalletLayout = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const WalletLayoutBody = styled.div`
    flex: 1;
    display: flex;
    max-height: calc(100% - 69px);
`;

const WalletRoutingWrapper = styled.div`
    flex: 1;
    overflow: auto;
    position: relative;
`;

const PreferencesLayout = styled.div`
    height: 100%;
    display: flex;
`;

const PreferencesRoutingWrapper = styled.div`
    flex: 1;
    overflow: auto;
    position: relative;
`;

const FullSizeWrapperBounded = styled(FullSizeWrapper)`
    max-height: 100%;
    overflow: auto;

    justify-content: center;
`;

export const Loader: FC = () => {
    const { data: activeWallet } = useActiveWallet();

    const lock = useLock(sdk);
    const { i18n } = useTranslation();
    const { data: account } = useAccountState();
    const { data: auth } = useAuthState();
    const { data: fiat } = useUserFiat();

    const tonendpoint = useTonendpoint(
        TARGET_ENV,
        sdk.version,
        activeWallet?.network,
        activeWallet?.lang
    );
    const { data: config } = useTonenpointConfig(tonendpoint);

    const navigate = useNavigate();
    useAppHeight();

    const { data: tracker } = useAnalytics(sdk.version, account, activeWallet);

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
        window.backgroundApi.onRefresh(() => queryClient.invalidateQueries());
    }, []);

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
        api: getApiConfig(config, network, REACT_APP_TONCONSOLE_API),
        auth,
        fiat,
        account,
        config,
        tonendpoint,
        standalone: true,
        extension: false,
        proFeatures: true,
        experimental: true,
        ios: false,
        env: {
            tgAuthBotId: REACT_APP_TG_BOT_ID,
            stonfiReferralAddress: REACT_APP_STONFI_REFERRAL_ADDRESS
        }
    };

    return (
        <AmplitudeAnalyticsContext.Provider value={tracker}>
            <OnImportAction.Provider value={navigate}>
                <AfterImportAction.Provider
                    value={() => navigate(AppRoute.home, { replace: true })}
                >
                    <AppContext.Provider value={context}>
                        <Content activeWallet={activeWallet} lock={lock} />
                        <CopyNotification hideSimpleCopyNotifications />
                        <QrScanner />
                    </AppContext.Provider>
                </AfterImportAction.Provider>
            </OnImportAction.Provider>
        </AmplitudeAnalyticsContext.Provider>
    );
};

const usePrefetch = () => {
    useRecommendations();
    useStonfiAssets();
    useCanPromptTouchId();
};

export const Content: FC<{
    activeWallet?: WalletState | null;
    lock: boolean;
}> = ({ activeWallet, lock }) => {
    const location = useLocation();
    useWindowsScroll();
    useAppWidth();
    useTrackLocation();
    usePrefetch();

    if (lock) {
        return (
            <FullSizeWrapper>
                <Unlock />
            </FullSizeWrapper>
        );
    }

    if (!activeWallet || location.pathname.startsWith(AppRoute.import)) {
        return (
            <FullSizeWrapperBounded className="full-size-wrapper">
                <InitializeContainer fullHeight={false}>
                    <Routes>
                        <Route
                            path={any(AppRoute.import)}
                            element={<ImportRouter listOfAuth={listOfAuth} />}
                        />
                        <Route path="*" element={<Initialize />} />
                    </Routes>
                </InitializeContainer>
            </FullSizeWrapperBounded>
        );
    }

    return (
        <WalletStateContext.Provider value={activeWallet}>
            <WideLayout>
                <AsideMenu />
                <WideContent>
                    <Routes>
                        <Route path={AppProRoute.dashboard} element={<DashboardPage />} />
                        <Route path={AppRoute.browser} element={<DesktopBrowser />} />
                        <Route path={any(AppRoute.settings)} element={<PreferencesContent />} />
                        <Route
                            path={any(AppProRoute.multiSend)}
                            element={<DesktopMultiSendPage />}
                        />
                        <Route path="*" element={<WalletContent />} />
                    </Routes>
                </WideContent>
                <BackgroundElements />
            </WideLayout>
        </WalletStateContext.Provider>
    );
};

const WalletContent = () => {
    return (
        <WalletLayout>
            <DesktopHeader />

            <WalletLayoutBody>
                <WalletAsideMenu />
                <WalletRoutingWrapper className="hide-scrollbar">
                    <Routes>
                        <Route element={<OldAppRouting />}>
                            <Route path={AppRoute.activity} element={<DesktopHistoryPage />} />
                            <Route path={any(AppRoute.purchases)} element={<DesktopPurchases />} />
                            <Route path={AppRoute.coins}>
                                <Route path=":name/*" element={<DesktopCoinPage />} />
                            </Route>
                            <Route
                                path={any(AppRoute.walletSettings)}
                                element={<DesktopWalletSettingsRouting />}
                            />
                            <Route path={AppRoute.notcoin} element={<NotcoinPage />} />
                            <Route path="*" element={<SwapPage />} />
                        </Route>
                    </Routes>
                </WalletRoutingWrapper>
            </WalletLayoutBody>
        </WalletLayout>
    );
};

const PreferencesContent = () => {
    return (
        <PreferencesLayout>
            <PreferencesAsideMenu />
            <PreferencesRoutingWrapper className="hide-scrollbar">
                <DesktopPreferencesRouting />
            </PreferencesRoutingWrapper>
        </PreferencesLayout>
    );
};

const OldAppRouting = () => {
    return (
        <Wrapper>
            <Outlet />
            <MemoryScroll />
        </Wrapper>
    );
};

const BackgroundElements = () => {
    return (
        <>
            <SendActionNotification />
            <ReceiveNotification />
            <TonConnectSubscription />
            <NftNotification />
            <SendNftNotification />
            <AddFavoriteNotification />
            <EditFavoriteNotification />
            <DeepLinkSubscription />
            <PairSignerNotification />
            <ConnectLedgerNotification />
        </>
    );
};
