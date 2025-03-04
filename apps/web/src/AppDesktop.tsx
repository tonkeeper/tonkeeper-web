import { Account } from '@tonkeeper/core/dist/entries/account';
import { useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
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
import { DesktopTokens } from '@tonkeeper/uikit/dist/desktop-pages/tokens/DesktopTokens';
import { useTrackLocation } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useRecommendations } from '@tonkeeper/uikit/dist/hooks/browser/useRecommendations';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import { AppProRoute, AppRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import Initialize from '@tonkeeper/uikit/dist/pages/import/Initialize';
import { Container, GlobalStyleCss } from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, { FC, PropsWithChildren, Suspense, useLayoutEffect, useMemo } from 'react';
import { Route, Switch, useLocation } from "react-router-dom";
import styled, { ThemeProvider, createGlobalStyle, useTheme } from 'styled-components';
import { useAppWidth } from './libs/hooks';
import {
  DesktopManageMultisigsPage
} from "@tonkeeper/uikit/dist/desktop-pages/manage-multisig-wallets/DesktopManageMultisigs";
import { DesktopMultisigOrdersPage } from "@tonkeeper/uikit/dist/desktop-pages/multisig-orders/DesktopMultisigOrders";
import { UrlTonConnectSubscription } from "./components/UrlTonConnectSubscription";

const DesktopAccountSettingsPage = React.lazy(
  () => import('@tonkeeper/uikit/dist/desktop-pages/settings/DesktopAccountSettingsPage')
);

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
const PairKeystoneNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/PairKeystoneNotification')
);

const ConnectLedgerNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/ConnectLedgerNotification')
);

const GlobalStyle = createGlobalStyle`
    ${GlobalStyleCss};
    
    body {
        font-family: '-apple-system', BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, Tahoma, Verdana, 'sans-serif';
    }
    
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
    min-width: 0;
    min-height: 0;
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

const DesktopView: FC<{
    activeAccount?: Account | null;
    lock: boolean;
}> = ({ activeAccount, lock }) => {
    const theme = useTheme();
    useWindowsScroll();
    useAppWidth(false);
    useRecommendations();
    useTrackLocation();
    useDebuggingTools();

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

const InitializeContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-height: var(--app-height);
    padding: 1rem 1rem;
    box-sizing: border-box;
    position: relative;
    justify-content: center;
`;

const FullScreen: FC<PropsWithChildren> = ({ children }) => {
    useLayoutEffect(() => {
        document.documentElement.classList.add('scroll');
        return () => {
            document.documentElement.classList.remove('scroll');
        };
    }, []);
    return <FullSizeWrapper>{children}</FullSizeWrapper>;
};
export const DesktopContent: FC<{
    activeAccount?: Account | null;
    lock: boolean;
}> = ({ activeAccount, lock }) => {
    const location = useLocation();

    if (lock) {
        return (
            <FullScreen>
                <Unlock />
            </FullScreen>
        );
    }

    if (!activeAccount || location.pathname.startsWith(AppRoute.import)) {
        return (
            <FullScreen>
                <InitializeContainer>
                   <Initialize />
                </InitializeContainer>
            </FullScreen>
        );
    }

    return (
        <WideLayout>
            <AsideMenu />
            <WideContent>
                <Switch>
                    <Route path={AppProRoute.dashboard} component={DashboardPage} />
                    <Route path={AppRoute.browser} component={DesktopBrowser} />
                    <Route path={AppRoute.settings} component={PreferencesContent} />
                    <Route path={AppProRoute.multiSend} component={DesktopMultiSendPage} />
                    <Route
                      path={AppRoute.accountSettings}
                      component={DesktopAccountSettingsPage}
                    />
                    <Route path="*" component={WalletContent} />
                </Switch>
            </WideContent>
            <BackgroundElements />
        </WideLayout>
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
                            <Route
                                path={AppRoute.purchases}
                                component={DesktopCollectables}
                            />
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
            <TonConnectSubscription />
            <NftNotification />
            <SendNftNotification />
            <AddFavoriteNotification />
            <EditFavoriteNotification />
            <PairSignerNotification />
            <ConnectLedgerNotification />
            <PairKeystoneNotification />
            <UrlTonConnectSubscription />
        </Suspense>
    );
};

export default DesktopView;
