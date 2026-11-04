import { FC, useCallback, useEffect } from 'react';
import { Account, AccountMultichain } from '@tonkeeper/core/dist/entries/account';
import { Route, Switch, useLocation, useParams } from 'react-router-dom';
import { useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { useAppWidth } from '../../libs/hooks';
import { useTrackLocation } from '@tonkeeper/uikit/dist/hooks/analytics';
import { useTrackLaunchApp } from '@tonkeeper/uikit/dist/hooks/analytics/launch-app';
import { useTrackWalletOpen } from '@tonkeeper/uikit/dist/hooks/analytics/wallet-open';
import { useTrackPushClick } from '../../libs/push-click';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import { AppProRoute, AppRoute, MultichainRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { MultichainDesktopShell } from '@tonkeeper/uikit/dist/pages/home/multichain/desktop/MultichainDesktopShell';
import { HomeMultichain } from '@tonkeeper/uikit/dist/pages/home/multichain/HomeMultichain';
import { MultichainAssetPage } from '@tonkeeper/uikit/dist/pages/home/multichain/asset/MultichainAssetPage';
import { MultichainHistory } from '@tonkeeper/uikit/dist/pages/home/multichain/history/MultichainHistory';
import { MultichainCollectiblesPage } from '@tonkeeper/uikit/dist/pages/home/multichain/collectibles/MultichainCollectiblesPage';
import { MultichainCollectiblesSettingsPage } from '@tonkeeper/uikit/dist/pages/home/multichain/collectibles/MultichainCollectiblesSettingsPage';
import { MultichainTradePage } from '@tonkeeper/uikit/dist/pages/home/multichain/trade/MultichainTradePage';
import { MultichainStakingPositionPage } from '@tonkeeper/uikit/dist/pages/home/multichain/staking/MultichainStakingPositionPage';
import { MultichainBrowserPage } from '@tonkeeper/uikit/dist/pages/home/multichain/browser/MultichainBrowserPage';
import { MultichainSettingsRouting } from '@tonkeeper/uikit/dist/pages/home/multichain/settings/MultichainSettingsRouting';
import { BrowserCategoryPage } from '@tonkeeper/uikit/dist/pages/home/multichain/browser/BrowserCategoryPage';
import { MobileDappBrowserController } from '../components/dapp-browser/MobileDappBrowserController';
import StartScreen from '@tonkeeper/uikit/dist/pages/import/StartScreen';
import { AsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/AsideMenu';
import DesktopBrowser from '@tonkeeper/uikit/dist/desktop-pages/browser';
import { DesktopMultiSendPage } from '@tonkeeper/uikit/dist/desktop-pages/multi-send';
import DesktopAccountSettingsPage from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopAccountSettingsPage';
import { DesktopWalletHeader } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopWalletHeader';
import { WalletAsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/WalletAsideMenu';
import { DesktopHistoryPage } from '@tonkeeper/uikit/dist/desktop-pages/history/DesktopHistoryPage';
import { DesktopCollectables } from '@tonkeeper/uikit/dist/desktop-pages/nft/DesktopCollectables';
import { DesktopDns } from '@tonkeeper/uikit/dist/desktop-pages/nft/DesktopDns';
import { DesktopCoinPage } from '@tonkeeper/uikit/dist/desktop-pages/coin/DesktopCoinPage';
import { DesktopManageMultisigsPage } from '@tonkeeper/uikit/dist/desktop-pages/manage-multisig-wallets/DesktopManageMultisigs';
import { DesktopMultisigOrdersPage } from '@tonkeeper/uikit/dist/desktop-pages/multisig-orders/DesktopMultisigOrders';
import { DesktopWalletSettingsRouting } from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopWalletSettingsRouting';
import { DesktopSwapPage } from '@tonkeeper/uikit/dist/desktop-pages/swap';
import { DesktopTokens } from '@tonkeeper/uikit/dist/desktop-pages/tokens/DesktopTokens';
import { DesktopPreferencesHeader } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopPreferencesHeader';
import { PreferencesAsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/PreferencesAsideMenu';
import { DesktopPreferencesRouting } from '@tonkeeper/uikit/dist/desktop-pages/preferences/DesktopPreferencesRouting';
import MemoryScroll from '@tonkeeper/uikit/dist/components/MemoryScroll';
import { AppLayout } from '@tonkeeper/uikit/dist/components/layout/AppLayout';
import styled from 'styled-components';
import { desktopHeaderContainerHeight } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopHeaderElements';
import { BackgroundElements, MultichainBackgroundElements, usePrefetch } from './common';
import { PullToRefresh } from '../components/PullToRefresh';
import { useQueryClient } from '@tanstack/react-query';
import { SplashScreen } from '@capacitor/splash-screen';
import { useRealtimeUpdatesInvalidation } from '@tonkeeper/uikit/dist/hooks/realtime';
import DashboardPage from '@tonkeeper/uikit/dist/desktop-pages/dashboard';
import { SecureWalletNotification } from '@tonkeeper/uikit/dist/components/desktop/SecureWalletNotification';
import { DesktopCancelLegacySubscriptionBanner } from '@tonkeeper/uikit/dist/components/legacy-plugins/DesktopCancelLegacySubscriptionBanner';

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

export const WideContent: FC<{
    activeAccount?: Account | null;
    lock: boolean;
}> = ({ activeAccount, lock }) => {
    const location = useLocation();
    useWindowsScroll();
    useAppWidth();
    useTrackLocation();
    useTrackLaunchApp();
    useTrackWalletOpen();
    useTrackPushClick();
    usePrefetch();
    useDebuggingTools();
    useRealtimeUpdatesInvalidation();

    useEffect(() => {
        SplashScreen.hide();
    }, []);

    const queryClient = useQueryClient();
    const onRefresh = useCallback(async () => {
        const promise1 = queryClient.invalidateQueries();
        const promise2 = new Promise(r => setTimeout(r, 1000));

        await Promise.all([promise1, promise2]);
    }, [queryClient]);

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

    // Multichain portfolio runs in the desktop shell — sidebar (balance +
    // active wallet) + centered 520px content column, same as the desktop
    // app. The legacy AppLayout chrome is not used.
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
                <MobileDappBrowserController />
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
            <SecureWalletNotification />
            <PullToRefresh onRefresh={onRefresh} />
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
