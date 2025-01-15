import { FC } from 'react';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { useAppWidth } from '../../libs/hooks';
import { useTrackLocation } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import { any, AppProRoute, AppRoute } from '@tonkeeper/uikit/dist/libs/routes';
import Initialize, { InitializeContainer } from '@tonkeeper/uikit/dist/pages/import/Initialize';
import DashboardPage from '@tonkeeper/uikit/dist/desktop-pages/dashboard';
import DesktopBrowser from '@tonkeeper/uikit/dist/desktop-pages/browser';
import { DesktopMultiSendPage } from '@tonkeeper/uikit/dist/desktop-pages/multi-send';
import DesktopAccountSettingsPage from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopAccountSettingsPage';
import { DesktopWalletHeader } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopWalletHeader';
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
import styled from 'styled-components';
import { Container } from '@tonkeeper/uikit';
import { desktopHeaderContainerHeight } from '@tonkeeper/uikit/dist/components/desktop/header/DesktopHeaderElements';
import { BackgroundElements, usePrefetch } from './common';
import './ionic-styles';

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

const FullSizeWrapperBounded = styled(FullSizeWrapper)`
    max-height: 100%;
    overflow: auto;

    justify-content: center;
`;

export const NarrowContent: FC<{
    activeAccount?: Account | null;
    lock: boolean;
}> = ({ activeAccount, lock }) => {
    const location = useLocation();
    useWindowsScroll();
    useAppWidth();
    useTrackLocation();
    usePrefetch();
    useDebuggingTools();

    if (lock) {
        return (
            <FullSizeWrapper>
                <Unlock />
            </FullSizeWrapper>
        );
    }

    if (!activeAccount || location.pathname.startsWith(AppRoute.import)) {
        return (
            <FullSizeWrapperBounded className="full-size-wrapper">
                <InitializeContainer fullHeight={false}>
                    <Initialize />
                </InitializeContainer>
            </FullSizeWrapperBounded>
        );
    }

    return (
        <WideLayout>
            <WideContent>
                <Routes>
                    <Route path={AppProRoute.dashboard} element={<DashboardPage />} />
                    <Route path={AppRoute.browser} element={<DesktopBrowser />} />
                    <Route path={any(AppRoute.settings)} element={<PreferencesContent />} />
                    <Route path={any(AppProRoute.multiSend)} element={<DesktopMultiSendPage />} />
                    <Route
                        path={any(AppRoute.accountSettings)}
                        element={<DesktopAccountSettingsPage />}
                    />
                    <Route path="*" element={<WalletContent />} />
                </Routes>
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
                <WalletRoutingWrapper className="hide-scrollbar">
                    <Routes>
                        <Route element={<OldAppRouting />}>
                            <Route path={AppRoute.activity} element={<DesktopHistoryPage />} />
                            <Route
                                path={any(AppRoute.purchases)}
                                element={<DesktopCollectables />}
                            />
                            <Route path={any(AppRoute.dns)} element={<DesktopDns />} />
                            <Route path={AppRoute.coins}>
                                <Route path=":name/*" element={<DesktopCoinPage />} />
                            </Route>
                            <Route
                                path={AppRoute.multisigWallets}
                                element={<DesktopManageMultisigsPage />}
                            />
                            <Route
                                path={AppRoute.multisigOrders}
                                element={<DesktopMultisigOrdersPage />}
                            />
                            <Route
                                path={any(AppRoute.walletSettings)}
                                element={<DesktopWalletSettingsRouting />}
                            />
                            <Route path={AppRoute.swap} element={<DesktopSwapPage />} />
                            <Route path="*" element={<DesktopTokens />} />
                        </Route>
                    </Routes>
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

const OldAppRouting = () => {
    return (
        <Wrapper>
            <Outlet />
            <MemoryScroll />
        </Wrapper>
    );
};
