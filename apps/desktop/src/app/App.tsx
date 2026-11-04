import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MultichainPromo } from '@tonkeeper/uikit/dist/components/modals/MultichainPromoModal';
import { MULTICHAIN_ENABLED } from '@tonkeeper/core/dist/multichain';
import { initChainKit } from '@tonkeeper/core/dist/service/chainkit/initChainKit';
import { WEB_PUSH_APP_ID } from '@tonkeeper/core/dist/service/chainkit/deviceAuthService';
import { Account, AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { localizationText } from '@tonkeeper/core/dist/entries/language';
import { getApiConfig, setProApiUrl } from '@tonkeeper/core/dist/entries/network';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { DocumentLanguageSync } from '@tonkeeper/uikit/dist/components/DocumentLanguageSync';
import { useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { AppLayout } from '@tonkeeper/uikit/dist/components/layout/AppLayout';
import ConnectLedgerNotification from '@tonkeeper/uikit/dist/components/ConnectLedgerNotification';
import { CopyNotification } from '@tonkeeper/uikit/dist/components/CopyNotification';
import { FooterGlobalStyle } from '@tonkeeper/uikit/dist/components/Footer';
import { HeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/Header';
import { GlobalListStyle } from '@tonkeeper/uikit/dist/components/List';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import MemoryScroll from '@tonkeeper/uikit/dist/components/MemoryScroll';
import { ModalsRoot } from '@tonkeeper/uikit/dist/components/ModalsRoot';
import PairKeystoneNotification from '@tonkeeper/uikit/dist/components/PairKeystoneNotification';
import PairSignerNotification from '@tonkeeper/uikit/dist/components/PairSignerNotification';
import QrScanner from '@tonkeeper/uikit/dist/components/QrScanner';
import { SybHeaderGlobalStyle } from '@tonkeeper/uikit/dist/components/SubHeader';
import { AsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/AsideMenu';
import { PreferencesAsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/PreferencesAsideMenu';
import { WalletAsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/WalletAsideMenu';
import { desktopHeaderContainerHeight } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopHeaderElements';
import { DesktopPreferencesHeader } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopPreferencesHeader';
import { DesktopWalletHeader } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopWalletHeader';
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
import { DesktopCollectables } from '@tonkeeper/uikit/dist/desktop-pages/nft/DesktopCollectables';
import { DesktopDns } from '@tonkeeper/uikit/dist/desktop-pages/nft/DesktopDns';
import { DesktopPreferencesRouting } from '@tonkeeper/uikit/dist/desktop-pages/preferences/DesktopPreferencesRouting';
import { DesktopWalletSettingsRouting } from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopWalletSettingsRouting';
import DesktopAccountSettingsPage from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopAccountSettingsPage';
import { DesktopSwapPage } from '@tonkeeper/uikit/dist/desktop-pages/swap';
import { DesktopStakingPage } from '@tonkeeper/uikit/dist/desktop-pages/staking';
import { DesktopTokens } from '@tonkeeper/uikit/dist/desktop-pages/tokens/DesktopTokens';
import { useTrackLocation } from '@tonkeeper/uikit/dist/hooks/analytics';
import { useTrackLaunchApp } from '@tonkeeper/uikit/dist/hooks/analytics/launch-app';
import { useTrackWalletOpen } from '@tonkeeper/uikit/dist/hooks/analytics/wallet-open';
import { AppContext, IAppContext } from '@tonkeeper/uikit/dist/hooks/appContext';
import { AppSdkContext } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useRecommendations } from '@tonkeeper/uikit/dist/hooks/browser/useRecommendations';
import { useLock } from '@tonkeeper/uikit/dist/hooks/lock';
import { StorageContext } from '@tonkeeper/uikit/dist/hooks/storage';
import {
    I18nContext,
    TranslationContext,
    useTWithReplaces
} from '@tonkeeper/uikit/dist/hooks/translation';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import { AppProRoute, AppRoute, MultichainRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { HomeMultichain } from '@tonkeeper/uikit/dist/pages/home/multichain/HomeMultichain';
import { MultichainBackgroundElements } from '@tonkeeper/uikit/dist/pages/home/multichain/MultichainBackgroundElements';
import { MultichainAssetPage } from '@tonkeeper/uikit/dist/pages/home/multichain/asset/MultichainAssetPage';
import { MultichainDesktopShell } from '@tonkeeper/uikit/dist/pages/home/multichain/desktop/MultichainDesktopShell';
import { MultichainHistory } from '@tonkeeper/uikit/dist/pages/home/multichain/history/MultichainHistory';
import { MultichainCollectiblesPage } from '@tonkeeper/uikit/dist/pages/home/multichain/collectibles/MultichainCollectiblesPage';
import { MultichainCollectiblesSettingsPage } from '@tonkeeper/uikit/dist/pages/home/multichain/collectibles/MultichainCollectiblesSettingsPage';
import { MultichainTradePage } from '@tonkeeper/uikit/dist/pages/home/multichain/trade/MultichainTradePage';
import { MultichainBrowserPage } from '@tonkeeper/uikit/dist/pages/home/multichain/browser/MultichainBrowserPage';
import { MultichainSettingsRouting } from '@tonkeeper/uikit/dist/pages/home/multichain/settings/MultichainSettingsRouting';
import { BrowserCategoryPage } from '@tonkeeper/uikit/dist/pages/home/multichain/browser/BrowserCategoryPage';
import { MultichainStakingPositionPage } from '@tonkeeper/uikit/dist/pages/home/multichain/staking/MultichainStakingPositionPage';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import { UnlockNotification } from '@tonkeeper/uikit/dist/pages/home/UnlockNotification';
import StartScreen from '@tonkeeper/uikit/dist/pages/import/StartScreen';
import { UserThemeProvider } from '@tonkeeper/uikit/dist/providers/UserThemeProvider';
import { RootErrorBoundary } from '@tonkeeper/uikit/dist/components/shared/RootErrorBoundary';
import { useDevSettings } from '@tonkeeper/uikit/dist/state/dev';
import { useUserFiatQuery } from '@tonkeeper/uikit/dist/state/fiat';
import { useUserLanguage } from '@tonkeeper/uikit/dist/state/language';
import { useCanPromptTouchId } from '@tonkeeper/uikit/dist/state/password';
import { useProApiUrl, useProBackupState } from '@tonkeeper/uikit/dist/state/pro';
import { useTonendpoint, useTonenpointConfig } from '@tonkeeper/uikit/dist/state/tonendpoint';
import { useAccountsStateQuery, useActiveAccountQuery } from '@tonkeeper/uikit/dist/state/wallet';
import { GlobalStyleCss } from '@tonkeeper/uikit/dist/styles/globalStyle';
import { FC, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Route, useLocation, Switch, MemoryRouter, useParams } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { DesktopAppSdk } from '../libs/appSdk';
import { useAnalytics, useAppHeight, useAppWidth } from '../libs/hooks';
import { DeepLinkSubscription } from './components/DeepLink';
import { MultichainConnectSubscription } from '@tonkeeper/uikit/dist/pages/home/multichain/connect/MultichainConnectSubscription';
import { TonConnectSubscription } from './components/TonConnectSubscription';
import { UpdateBanner } from './components/UpdateBanner';
import { useGlobalPreferencesQuery } from '@tonkeeper/uikit/dist/state/global-preferences';
import { DesktopManageMultisigsPage } from '@tonkeeper/uikit/dist/desktop-pages/manage-multisig-wallets/DesktopManageMultisigs';
import { useGlobalSetup } from '@tonkeeper/uikit/dist/state/globalSetup';
import { DesktopMultisigOrdersPage } from '@tonkeeper/uikit/dist/desktop-pages/multisig-orders/DesktopMultisigOrders';
import { useRealtimeUpdatesInvalidation } from '@tonkeeper/uikit/dist/hooks/realtime';
import { CryptoStrategyInstaller } from '@tonkeeper/uikit/dist/components/pro/CryptoStrategyInstaller';
import { localesList } from '@tonkeeper/locales/localesList';
import { useAppCountryInfo } from '@tonkeeper/uikit/dist/state/country';
import { SecureWalletNotification } from '@tonkeeper/uikit/dist/components/desktop/SecureWalletNotification';
import { DesktopCancelLegacySubscriptionBanner } from '@tonkeeper/uikit/dist/components/legacy-plugins/DesktopCancelLegacySubscriptionBanner';

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
initChainKit(sdk.storage, {
    platform: 'desktop',
    appId: WEB_PUSH_APP_ID,
    clientVersion: sdk.version
});

export const Providers = () => {
    const { t: tSimple, i18n } = useTranslation();

    const t = useTWithReplaces(tSimple);

    const translation = useMemo(() => {
        const client: I18nContext = {
            t,
            i18n: {
                enable: true,
                reloadResources: i18n.reloadResources,
                changeLanguage: i18n.changeLanguage as any,
                language: i18n.language,
                languages: localesList
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
                        <DocumentLanguageSync />
                        <StorageContext.Provider value={sdk.storage}>
                            <ThemeAndContent />
                        </StorageContext.Provider>
                    </TranslationContext.Provider>
                </AppSdkContext.Provider>
            </Suspense>
        </QueryClientProvider>
    );
};

export const App = () => {
    return (
        <MemoryRouter>
            <Providers />
        </MemoryRouter>
    );
};

const ThemeAndContent = () => {
    const { data } = useProBackupState();
    return (
        <UserThemeProvider
            displayType="full-width"
            isPro={Boolean(data?.valid)}
            isProSupported
            proDisplayType="desktop"
        >
            <GlobalStyle />
            <HeaderGlobalStyle />
            <FooterGlobalStyle />
            <SybHeaderGlobalStyle />
            <GlobalListStyle />
            <RootErrorBoundary>
                <Loader />
            </RootErrorBoundary>
            <UnlockNotification sdk={sdk} />
        </UserThemeProvider>
    );
};

const Wrapper = styled.div`
    box-sizing: border-box;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: ${props => props.theme.backgroundPage};
    white-space: pre-wrap;
`;

const WalletLayout = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
`;

const WalletLayoutBody = styled.div`
    position: relative;
    flex: 1;
    display: flex;
    max-height: calc(100% - ${desktopHeaderContainerHeight});
`;

const WalletRoutingWrapper = styled.div`
    flex: 1;
    overflow: auto;
    position: relative;
`;

const PreferencesLayout = styled.div`
    height: calc(100% - ${desktopHeaderContainerHeight});
    display: flex;
    overflow: auto;
`;

const PreferencesRoutingWrapper = styled.div`
    flex: 1;
    overflow: auto;
    position: relative;
`;

export const Loader: FC = () => {
    const { data: activeAccount, isLoading: activeWalletLoading } = useActiveAccountQuery();
    const { data: accounts, isLoading: isWalletsLoading } = useAccountsStateQuery();
    const { data: lang, isLoading: isLangLoading } = useUserLanguage();
    const { data: devSettings } = useDevSettings();
    const { isLoading: globalPreferencesLoading } = useGlobalPreferencesQuery();
    const { isLoading: globalSetupLoading } = useGlobalSetup();
    const { data: countryInfo } = useAppCountryInfo();

    const lock = useLock(sdk);
    const { i18n } = useTranslation();
    const { data: fiat } = useUserFiatQuery();

    const tonendpoint = useTonendpoint({
        build: sdk.version,
        lang,
        platform: 'desktop',
        deviceCountryCode: countryInfo?.deviceCountryCode,
        storeCountryCode: countryInfo?.storeCountryCode
    });
    const { data: serverConfig } = useTonenpointConfig(tonendpoint);
    const { data: proApiUrl } = useProApiUrl(serverConfig?.mainnetConfig);

    useAppHeight();

    const { data: tracker } = useAnalytics(
        sdk.version,
        serverConfig?.mainnetConfig,
        activeAccount,
        accounts
    );

    useEffect(() => {
        if (lang && i18n.language !== localizationText(lang)) {
            i18n.reloadResources([localizationText(lang)]).then(() =>
                i18n.changeLanguage(localizationText(lang))
            );
        }
    }, [lang, i18n]);

    useEffect(() => {
        window.backgroundApi.onRefresh(() => queryClient.invalidateQueries());
    }, []);

    if (
        activeWalletLoading ||
        isLangLoading ||
        isWalletsLoading ||
        serverConfig === undefined ||
        lock === undefined ||
        fiat === undefined ||
        proApiUrl === undefined ||
        !devSettings ||
        globalPreferencesLoading ||
        globalSetupLoading
    ) {
        return <Loading />;
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
        standalone: true,
        extension: false,
        proFeatures: true,
        experimental: true,
        ios: false,
        defaultWalletVersion: WalletVersion.V5R1,
        multichainEnabled: MULTICHAIN_ENABLED,
        tracker: tracker?.track
    };

    return (
        <AppContext.Provider value={context}>
            <CryptoStrategyInstaller>
                <Content activeAccount={activeAccount} lock={lock} />
                <CopyNotification hideSimpleCopyNotifications />
                <QrScanner />
                <ModalsRoot />
                <UpdateBanner />
            </CryptoStrategyInstaller>
        </AppContext.Provider>
    );
};

const usePrefetch = () => {
    useRecommendations();
    useCanPromptTouchId();
};

export const Content: FC<{
    activeAccount?: Account | null;
    lock: boolean;
}> = ({ activeAccount, lock }) => {
    const location = useLocation();
    useWindowsScroll();
    useAppWidth();
    useTrackLocation();
    useTrackLaunchApp();
    useTrackWalletOpen();
    usePrefetch();
    useDebuggingTools();
    useRealtimeUpdatesInvalidation();

    if (lock) {
        return <Unlock />;
    }

    if (!activeAccount || location.pathname.startsWith(AppRoute.import)) {
        return (
            <AppLayout bare>
                <StartScreen />
            </AppLayout>
        );
    }

    // Multichain portfolio runs in its own desktop shell — sidebar
    // (balance + active wallet) + centered 520px content column. The
    // legacy AppLayout / DesktopTokens chrome is not used.
    if (activeAccount.type === 'multichain') {
        const account = activeAccount as AccountMultichain;
        return (
            <>
                <MultichainDesktopShell account={account}>
                    <Switch>
                        <Route path={`${MultichainRoute.asset}/:assetId`}>
                            <MultichainAssetRoute compact />
                        </Route>
                        <Route path={MultichainRoute.history}>
                            <MultichainHistory compact />
                        </Route>
                        <Route path={MultichainRoute.collectiblesSettings}>
                            <MultichainCollectiblesSettingsPage compact />
                        </Route>
                        <Route path={MultichainRoute.collectibles}>
                            <MultichainCollectiblesPage compact />
                        </Route>
                        <Route path={MultichainRoute.trade}>
                            <MultichainTradePage compact />
                        </Route>
                        <Route path={`${MultichainRoute.staking}/:poolAddress`}>
                            <MultichainStakingPositionRoute compact />
                        </Route>
                        <Route path={`${MultichainRoute.browserCategory}/:id`}>
                            <BrowserCategoryPage compact />
                        </Route>
                        <Route path={MultichainRoute.browser}>
                            <MultichainBrowserPage compact />
                        </Route>
                        <Route path={MultichainRoute.settings}>
                            <MultichainSettingsRouting compact />
                        </Route>
                        <Route path="*">
                            <HomeMultichain compact />
                        </Route>
                    </Switch>
                </MultichainDesktopShell>
                <MultichainBackgroundElements />
                <TonConnectSubscription />
                <DeepLinkSubscription />
                <MultichainConnectSubscription />
            </>
        );
    }

    return (
        <AppLayout sidebar={<AsideMenu />}>
            <Switch>
                <Route path={AppProRoute.dashboard} component={DashboardPage} />
                <Route path={AppRoute.browser} component={DesktopBrowser} />
                <Route path={AppRoute.settings} component={PreferencesContent} />
                <Route path={AppProRoute.multiSend} component={DesktopMultiSendPage} />
                <Route path={AppRoute.accountSettings} component={DesktopAccountSettingsPage} />
                <Route path="*" component={WalletContent} />
            </Switch>
            <BackgroundElements />
        </AppLayout>
    );
};

const MultichainAssetRoute: FC<{ compact?: boolean }> = ({ compact }) => {
    const { assetId } = useParams<{ assetId: string }>();
    return <MultichainAssetPage assetId={decodeURIComponent(assetId)} compact={compact} />;
};

const MultichainStakingPositionRoute: FC<{ compact?: boolean }> = ({ compact }) => {
    const { poolAddress } = useParams<{ poolAddress: string }>();
    return (
        <MultichainStakingPositionPage
            poolAddress={decodeURIComponent(poolAddress)}
            compact={compact}
        />
    );
};

const WalletContent = () => {
    return (
        <WalletLayout>
            <DesktopWalletHeader />

            <WalletLayoutBody>
                <WalletAsideMenu />
                <WalletRoutingWrapper className="hide-scrollbar">
                    <Wrapper>
                        <Switch>
                            <Route path={AppRoute.activity} component={DesktopHistoryPage} />
                            <Route path={AppRoute.purchases} component={DesktopCollectables} />
                            <Route path={AppRoute.dns} component={DesktopDns} />
                            <Route path={`${AppRoute.coins}/:name`} component={DesktopCoinPage} />
                            <Route
                                path={AppRoute.multisigWallets}
                                component={DesktopManageMultisigsPage}
                            />
                            <Route
                                path={AppRoute.multisigOrders}
                                component={DesktopMultisigOrdersPage}
                            />
                            <Route
                                path={AppRoute.walletSettings}
                                component={DesktopWalletSettingsRouting}
                            />
                            <Route path={AppRoute.swap} component={DesktopSwapPage} />
                            <Route path={AppRoute.staking} component={DesktopStakingPage} />
                            <Route path="*" component={DesktopTokens} />
                        </Switch>
                        <MemoryScroll />
                    </Wrapper>
                </WalletRoutingWrapper>
                <DesktopCancelLegacySubscriptionBanner />
            </WalletLayoutBody>
        </WalletLayout>
    );
};

const PreferencesContent = () => {
    return (
        <>
            <DesktopPreferencesHeader />
            <PreferencesLayout>
                <PreferencesAsideMenu />
                <PreferencesRoutingWrapper className="hide-scrollbar">
                    <DesktopPreferencesRouting />
                </PreferencesRoutingWrapper>
            </PreferencesLayout>
        </>
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
            <MultichainConnectSubscription />
            <PairSignerNotification />
            <ConnectLedgerNotification />
            <PairKeystoneNotification />
            <SecureWalletNotification />
            <MultichainPromo />
        </>
    );
};
