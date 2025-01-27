import { Account } from '@tonkeeper/core/dist/entries/account';
import { InnerBody, useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { Footer } from '@tonkeeper/uikit/dist/components/Footer';
import { Header } from '@tonkeeper/uikit/dist/components/Header';
import { Loading } from '@tonkeeper/uikit/dist/components/Loading';
import MemoryScroll from '@tonkeeper/uikit/dist/components/MemoryScroll';
import {
    ActivitySkeletonPage,
    BrowserSkeletonPage,
    CoinSkeletonPage,
    HomeSkeleton,
    SettingsSkeletonPage
} from '@tonkeeper/uikit/dist/components/Skeleton';
import {
    AddFavoriteNotification,
    EditFavoriteNotification
} from '@tonkeeper/uikit/dist/components/transfer/FavoriteNotification';
import { useTrackLocation } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import { AppRoute, SignerRoute } from '@tonkeeper/uikit/dist/libs/routes';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import Initialize, { InitializeContainer } from '@tonkeeper/uikit/dist/pages/import/Initialize';
import { useKeyboardHeight } from '@tonkeeper/uikit/dist/pages/import/hooks';
import { Container } from '@tonkeeper/uikit/dist/styles/globalStyle';
import React, { FC, Suspense, useMemo } from "react";
import { Route, Switch, useLocation } from "react-router-dom";
import styled, { ThemeProvider, css, useTheme } from 'styled-components';
import { useAppWidth } from './libs/hooks';
import { UrlTonConnectSubscription } from "./components/UrlTonConnectSubscription";

const Settings = React.lazy(() => import('@tonkeeper/uikit/dist/pages/settings'));
const Browser = React.lazy(() => import('@tonkeeper/uikit/dist/pages/browser'));
const Activity = React.lazy(() => import('@tonkeeper/uikit/dist/pages/activity/Activity'));
const Home = React.lazy(() => import('@tonkeeper/uikit/dist/pages/home/Home'));
const Coin = React.lazy(() => import('@tonkeeper/uikit/dist/pages/coin/Coin'));
const SwapPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/swap'));
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
const SignerLinkPage = React.lazy(() => import('@tonkeeper/uikit/dist/pages/signer/LinkPage'));
const SignerPublishNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/pages/signer/PublishNotification')
);

const ConnectLedgerNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/components/ConnectLedgerNotification')
);
const SwapMobileNotification = React.lazy(
    () => import('@tonkeeper/uikit/dist/pages/swap/SwapMobileNotification')
);

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

export const MobileView: FC<{
    activeAccount?: Account | null;
    lock: boolean;
    standalone: boolean;
}> = ({ activeAccount, lock, standalone }) => {
    const theme = useTheme();
    useWindowsScroll();
    useAppWidth(standalone);
    useKeyboardHeight();
    useTrackLocation();
    useDebuggingTools();

    const updated = useMemo(() => {
        theme.displayType = 'compact';
        return theme;
    }, [theme]);

    return (
        <ThemeProvider theme={updated}>
            <MobileContent activeAccount={activeAccount} lock={lock} standalone={standalone} />
        </ThemeProvider>
    );
};

export const MobileContent: FC<{
    activeAccount?: Account | null;
    lock: boolean;
    standalone: boolean;
}> = ({ activeAccount, lock, standalone }) => {
    const location = useLocation();

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
                <Switch>
                    <Route path={AppRoute.signer}>
                        <Route
                            path={SignerRoute.link}
                        ><Suspense>
                          <SignerLinkPage />
                        </Suspense></Route>
                    </Route>
                </Switch>
            </Wrapper>
        );
    }

    if (!activeAccount || location.pathname.startsWith(AppRoute.import)) {
        return (
            <FullSizeWrapper standalone={false}>
                <Suspense fallback={<Loading />}>
                    <InitializeContainer fullHeight={false}>
                        <Initialize />
                    </InitializeContainer>
                </Suspense>
            </FullSizeWrapper>
        );
    }

    return (
        <Wrapper standalone={standalone}>
            <Switch>
                <Route
                    path={AppRoute.activity}
                > <Suspense fallback={<ActivitySkeletonPage />}>
                  <Activity />
                </Suspense>
                </Route>
                <Route
                    path={AppRoute.browser}
                > <Suspense fallback={<BrowserSkeletonPage />}>
                  <Browser />
                </Suspense></Route>
                <Route
                    path={AppRoute.settings}
                > <Suspense fallback={<SettingsSkeletonPage />}>
                  <Settings />
                </Suspense></Route>
                <Route path={`${AppRoute.coins}/:name`}>
                    <Suspense fallback={<CoinSkeletonPage />}>
                      <Coin />
                    </Suspense>
                </Route>
                <Route
                    path={AppRoute.swap}
                > <Suspense fallback={null}>
                  <SwapPage />
                </Suspense></Route>
                <Route
                    path="*"
                > <>
                  <Header />
                  <InnerBody>
                    <Suspense fallback={<HomeSkeleton />}>
                      <Home />
                    </Suspense>
                  </InnerBody>
                </></Route>
            </Switch>
            <Footer standalone={standalone} />
            <MemoryScroll />
            <Notifications />
            <UrlTonConnectSubscription />
        </Wrapper>
    );
};

const Notifications = () => {
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
            <SignerPublishNotification />
            <ConnectLedgerNotification />
            <SwapMobileNotification />
            <PairKeystoneNotification />
        </Suspense>
    );
};
