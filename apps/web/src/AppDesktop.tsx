import { Account, AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { MultichainPromo } from '@tonkeeper/uikit/dist/components/modals/MultichainPromoModal';
import { HomeMultichain } from '@tonkeeper/uikit/dist/pages/home/multichain/HomeMultichain';
import { MultichainBackgroundElements } from '@tonkeeper/uikit/dist/pages/home/multichain/MultichainBackgroundElements';
import { MultichainAssetPage } from '@tonkeeper/uikit/dist/pages/home/multichain/asset/MultichainAssetPage';
import { MultichainDesktopShell } from '@tonkeeper/uikit/dist/pages/home/multichain/desktop/MultichainDesktopShell';
import { MultichainHistory } from '@tonkeeper/uikit/dist/pages/home/multichain/history/MultichainHistory';
import { MultichainCollectiblesPage } from '@tonkeeper/uikit/dist/pages/home/multichain/collectibles/MultichainCollectiblesPage';
import { MultichainCollectiblesSettingsPage } from '@tonkeeper/uikit/dist/pages/home/multichain/collectibles/MultichainCollectiblesSettingsPage';
import { MultichainTradePage } from '@tonkeeper/uikit/dist/pages/home/multichain/trade/MultichainTradePage';
import { MultichainStakingPositionPage } from '@tonkeeper/uikit/dist/pages/home/multichain/staking/MultichainStakingPositionPage';
import { MultichainBrowserPage } from '@tonkeeper/uikit/dist/pages/home/multichain/browser/MultichainBrowserPage';
import { MultichainSettingsRouting } from '@tonkeeper/uikit/dist/pages/home/multichain/settings/MultichainSettingsRouting';
import { BrowserCategoryPage } from '@tonkeeper/uikit/dist/pages/home/multichain/browser/BrowserCategoryPage';
import { useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { AppLayout } from '@tonkeeper/uikit/dist/components/layout/AppLayout';
import MemoryScroll from '@tonkeeper/uikit/dist/components/MemoryScroll';
import { AsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/AsideMenu';
import { PreferencesAsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/PreferencesAsideMenu';
import { WalletAsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/WalletAsideMenu';
import { desktopHeaderContainerHeight } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopHeaderElements';
import { DesktopPreferencesHeader } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopPreferencesHeader';
import { DesktopWalletHeader } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopWalletHeader';
import {
    AddFavoriteNotification,
    EditFavoriteNotification
} from '@tonkeeper/uikit/dist/components/transfer/FavoriteNotification';
import DesktopBrowser from '@tonkeeper/uikit/dist/desktop-pages/browser';
import { DesktopCoinPage } from '@tonkeeper/uikit/dist/desktop-pages/coin/DesktopCoinPage';
import DashboardPage from '@tonkeeper/uikit/dist/desktop-pages/dashboard';
import { DesktopHistoryPage } from '@tonkeeper/uikit/dist/desktop-pages/history/DesktopHistoryPage';
import { DesktopMultiSendPage } from '@tonkeeper/uikit/dist/desktop-pages/multi-send';
import { DesktopCollectables } from '@tonkeeper/uikit/dist/desktop-pages/nft/DesktopCollectables';
import { DesktopDns } from '@tonkeeper/uikit/dist/desktop-pages/nft/DesktopDns';
import { DesktopPreferencesRouting } from '@tonkeeper/uikit/dist/desktop-pages/preferences/DesktopPreferencesRouting';
import { DesktopWalletSettingsRouting } from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopWalletSettingsRouting';
import { DesktopSwapPage } from '@tonkeeper/uikit/dist/desktop-pages/swap';
import { DesktopStakingPage } from '@tonkeeper/uikit/dist/desktop-pages/staking';
import { DesktopTokens } from '@tonkeeper/uikit/dist/desktop-pages/tokens/DesktopTokens';
import { useTrackLocation } from '@tonkeeper/uikit/dist/hooks/analytics';
import { useTrackLaunchApp } from '@tonkeeper/uikit/dist/hooks/analytics/launch-app';
import { useTrackWalletOpen } from '@tonkeeper/uikit/dist/hooks/analytics/wallet-open';
import { useRecommendations } from '@tonkeeper/uikit/dist/hooks/browser/useRecommendations';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import { AppProRoute, AppRoute, MultichainRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import StartScreen from '@tonkeeper/uikit/dist/pages/import/StartScreen';
import { GlobalStyleCss } from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, { FC, Suspense, useMemo } from 'react';
import { Route, Switch, useLocation, useParams } from 'react-router-dom';
import styled, { ThemeProvider, createGlobalStyle, useTheme } from 'styled-components';
import { useAppWidth } from './libs/hooks';
import { DesktopManageMultisigsPage } from '@tonkeeper/uikit/dist/desktop-pages/manage-multisig-wallets/DesktopManageMultisigs';
import { DesktopMultisigOrdersPage } from '@tonkeeper/uikit/dist/desktop-pages/multisig-orders/DesktopMultisigOrders';
import { UrlTonConnectSubscription } from './components/UrlTonConnectSubscription';
import { useRealtimeUpdatesInvalidation } from '@tonkeeper/uikit/dist/hooks/realtime';
import { DesktopCancelLegacySubscriptionBanner } from '@tonkeeper/uikit/dist/components/legacy-plugins/DesktopCancelLegacySubscriptionBanner';

const DesktopAccountSettingsPage = React.lazy(
    () => import('@tonkeeper/uikit/dist/desktop-pages/settings/DesktopAccountSettingsPage')
);

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

const ConnectLedgerNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/ConnectLedgerNotification')
);

const GlobalStyle = createGlobalStyle`
    ${GlobalStyleCss};

    html, body, #root {
        height: 100%;
        overflow: hidden;
    }

    html.scroll,
    html.scroll body,
    html.scroll #root {
        overflow: auto;
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

const DesktopView: FC<{
    activeAccount?: Account | null;
    lock: boolean;
}> = ({ activeAccount, lock }) => {
    const theme = useTheme();
    useWindowsScroll();
    useAppWidth(false);
    useRecommendations();
    useTrackLocation();
    useTrackLaunchApp();
    useTrackWalletOpen();
    useDebuggingTools();
    useRealtimeUpdatesInvalidation();

    const updated = useMemo(() => {
        theme.displayType = 'full-width';
        return theme;
    }, [theme]);

    return (
        <ThemeProvider theme={updated}>
            <GlobalStyle />
            <DesktopContent activeAccount={activeAccount} lock={lock} />
        </ThemeProvider>
    );
};

export const DesktopContent: FC<{
    activeAccount?: Account | null;
    lock: boolean;
}> = ({ activeAccount, lock }) => {
    const location = useLocation();

    if (lock) {
        return <Unlock />;
    }

    const isOnboarding = !activeAccount || location.pathname.startsWith(AppRoute.import);

    if (isOnboarding) {
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
                <Suspense>
                    <WebTonConnectSubscription />
                    <UrlTonConnectSubscription />
                    <MultichainConnectSubscription />
                </Suspense>
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
        <Suspense>
            <SendActionNotification />
            <ReceiveNotification />
            <WebTonConnectSubscription />
            <NftNotification />
            <SendNftNotification />
            <AddFavoriteNotification />
            <EditFavoriteNotification />
            <PairSignerNotification />
            <ConnectLedgerNotification />
            <PairKeystoneNotification />
            <UrlTonConnectSubscription />
            <MultichainConnectSubscription />
            <MultichainPromo />
        </Suspense>
    );
};

export default DesktopView;
