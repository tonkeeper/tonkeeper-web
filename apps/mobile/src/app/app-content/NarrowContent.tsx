import { ComponentProps, FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Redirect, Route, useHistory, useLocation } from 'react-router-dom';
import { useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { useAppWidth } from '../../libs/hooks';
import { useTrackLocation } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import { Unlock } from '@tonkeeper/uikit/dist/pages/home/Unlock';
import {
    AppProRoute,
    AppRoute,
    SettingsRoute,
    WalletSettingsRoute
} from '@tonkeeper/uikit/dist/libs/routes';
import Initialize, { InitializeContainer } from '@tonkeeper/uikit/dist/pages/import/Initialize';
import DashboardPage from '@tonkeeper/uikit/dist/desktop-pages/dashboard';
import DesktopBrowser from '@tonkeeper/uikit/dist/desktop-pages/browser';
import { DesktopMultiSendPage } from '@tonkeeper/uikit/dist/desktop-pages/multi-send';
import DesktopAccountSettingsPage from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopAccountSettingsPage';
import { DesktopCollectables } from '@tonkeeper/uikit/dist/desktop-pages/nft/DesktopCollectables';
import { DesktopDns } from '@tonkeeper/uikit/dist/desktop-pages/nft/DesktopDns';
import { DesktopCoinPage } from '@tonkeeper/uikit/dist/desktop-pages/coin/DesktopCoinPage';
import { DesktopManageMultisigsPage } from '@tonkeeper/uikit/dist/desktop-pages/manage-multisig-wallets/DesktopManageMultisigs';
import { DesktopMultisigOrdersPage } from '@tonkeeper/uikit/dist/desktop-pages/multisig-orders/DesktopMultisigOrders';
import { DesktopSwapPage } from '@tonkeeper/uikit/dist/desktop-pages/swap';
import styled, { createGlobalStyle } from 'styled-components';
import { Container } from '@tonkeeper/uikit';
import { BackgroundElements, usePrefetch } from './common';
import './ionic-styles';
import { IonContent, IonMenu, IonModal, IonRouterOutlet } from '@ionic/react';
import { DesktopHistoryPage } from '@tonkeeper/uikit/dist/desktop-pages/history/DesktopHistoryPage';
import { DesktopConnectedAppsSettings } from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopConnectedAppsSettings';
import { DesktopNftSettings } from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopNftSettings';
import { MAMIndexesPage } from '@tonkeeper/uikit/dist/pages/settings/MamIndexes';
import { BatteryPage } from '@tonkeeper/uikit/dist/pages/settings/Battery';
import { WalletVersionPage } from '@tonkeeper/uikit/dist/pages/settings/Version';
import { LedgerIndexesPage } from '@tonkeeper/uikit/dist/pages/settings/LedgerIndexes';
import { TwoFAPage } from '@tonkeeper/uikit/dist/pages/settings/TwoFA';
import { Notifications } from '@tonkeeper/uikit/dist/pages/settings/Notification';
import { DesktopWalletSettingsPage } from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopWalletSettingsPage';
import { ActiveRecovery, Recovery } from '@tonkeeper/uikit/dist/pages/settings/Recovery';
import { JettonsSettings } from '@tonkeeper/uikit/dist/pages/settings/Jettons';

import { AsideMenu } from '@tonkeeper/uikit/dist/components/desktop/aside/AsideMenu';
import { MobileProHomePage } from '@tonkeeper/uikit/dist/mobile-pro-pages/MobileProHomePage';
import { DesktopTokens } from '@tonkeeper/uikit/dist/desktop-pages/tokens/DesktopTokens';
import { MobileProFooter } from '@tonkeeper/uikit/dist/components/mobile-pro/footer/MobileProFooter';
import { MobileProWalletMenu } from '@tonkeeper/uikit/dist/components/mobile-pro/MobileProWalletMenu';
import { IonicOverride } from './ionic-override';
import { Navigate } from '@tonkeeper/uikit/dist/components/shared/Navigate';
import { MobileProPreferencesPage } from '@tonkeeper/uikit/dist/mobile-pro-pages/MobileProPreferencesPage';
import { DesktopManageAccountsPage } from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopManageWalletsSettings';
import { Localization } from '@tonkeeper/uikit/dist/pages/settings/Localization';
import { Legal } from '@tonkeeper/uikit/dist/pages/settings/Legal';
import { UserTheme } from '@tonkeeper/uikit/dist/pages/settings/Theme';
import { DevSettings } from '@tonkeeper/uikit/dist/pages/settings/Dev';
import { FiatCurrency } from '@tonkeeper/uikit/dist/pages/settings/FiatCurrency';
import { SecuritySettings } from '@tonkeeper/uikit/dist/pages/settings/Security';
import { CountrySettings } from '@tonkeeper/uikit/dist/pages/settings/Country';
import { ProSettings } from '@tonkeeper/uikit/dist/components/settings/ProSettings';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { createIsolatedMemoryHistory } from '../../libs/isolated-memory-history';
import { SplashScreen } from '@capacitor/splash-screen';
import { useAllChainsAssetsWithPrice } from '@tonkeeper/uikit/dist/state/home';

const FullSizeWrapper = styled(Container)`
    max-width: 800px;
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

const WalletLayout = styled.div<{ $gradient: boolean }>`
    display: flex;
    flex-direction: column;
    height: 100%;

    position: relative;
`;

const WalletLayoutBody = styled.div`
    position: relative;
    flex: 1;
    display: flex;
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
    return (
        <>
            <NarrowEnvGlobalStyles />
            <NarrowContentBody activeAccount={activeAccount} lock={lock} />
        </>
    );
};

const NarrowContentBody: FC<{
    activeAccount?: Account | null;
    lock: boolean;
}> = ({ activeAccount, lock }) => {
    const location = useLocation();
    useWindowsScroll();
    useAppWidth();
    useTrackLocation();
    usePrefetch();
    useDebuggingTools();
    const { assets } = useAllChainsAssetsWithPrice();
    const isSplashHidden = useRef(false);

    const isReady = assets !== undefined;

    useEffect(() => {
        if (isReady && !isSplashHidden.current) {
            isSplashHidden.current = true;
            SplashScreen.hide();
        }
    }, [isReady]);

    if (lock) {
        return (
            <FullSizeWrapper>
                <Unlock />
            </FullSizeWrapper>
        );
    }

    if (!activeAccount || location.pathname?.startsWith(AppRoute.import)) {
        return (
            <FullSizeWrapperBounded className="full-size-wrapper">
                <InitializeContainer fullHeight={false}>
                    <Initialize />
                </InitializeContainer>
            </FullSizeWrapperBounded>
        );
    }

    return <NarrowContentAppRouting />;
};

const NarrowContentAppRouting = () => {
    const location = useLocation();

    return (
        <WideLayout>
            <WideContent id="main-id--">
                <WalletLayout $gradient={location.pathname === AppRoute.home}>
                    <IonMenu menuId="aside-nav" contentId="main-content" type="push">
                        <AsideMenu />
                    </IonMenu>
                    <MobileProWalletMenu />
                    <WalletLayoutBody>
                        {/* Ionic doesn't support nested routing well */}
                        <IonRouterOutlet id="main-content">
                            <Route path={AppProRoute.dashboard} component={DashboardPage} />
                            <Route path={AppRoute.browser} component={DesktopBrowser} />
                            <Route path={AppProRoute.multiSend} component={DesktopMultiSendPage} />
                            <Route
                                path={AppRoute.accountSettings}
                                component={DesktopAccountSettingsPage}
                            />

                            <Route path={AppRoute.activity} component={DesktopHistoryPage} />
                            <Route path={AppRoute.purchases} component={DesktopCollectables} />
                            <Route path={AppRoute.dns} component={DesktopDns} />
                            <Route
                                path={AppRoute.multisigWallets}
                                component={DesktopManageMultisigsPage}
                            />
                            <Route
                                path={AppRoute.multisigOrders}
                                component={DesktopMultisigOrdersPage}
                            />
                            <Route path={AppRoute.swap} component={DesktopSwapPage} />
                            <Route path={AppRoute.home} exact component={MobileProHomePage} />
                            <Route path={AppRoute.coins} exact component={DesktopTokens} />
                            <Route path={`${AppRoute.coins}/:name`} component={DesktopCoinPage} />

                            {/* Wallet settings */}
                            <Route
                                path={AppRoute.walletSettings}
                                exact
                                component={DesktopWalletSettingsPage}
                            />
                            <Route
                                path={`${
                                    AppRoute.walletSettings + WalletSettingsRoute.recovery
                                }/:accountId`}
                                component={Recovery}
                            />
                            <Route
                                path={AppRoute.walletSettings + WalletSettingsRoute.recovery}
                                component={ActiveRecovery}
                                exact
                            />
                            <Route
                                path={AppRoute.walletSettings + WalletSettingsRoute.jettons}
                                component={JettonsSettings}
                            />

                            <Route
                                path={AppRoute.walletSettings + WalletSettingsRoute.connectedApps}
                                component={DesktopConnectedAppsSettings}
                            />
                            <Route
                                path={AppRoute.walletSettings + WalletSettingsRoute.nft}
                                component={DesktopNftSettings}
                            />
                            <Route
                                path={AppRoute.walletSettings + WalletSettingsRoute.derivations}
                                component={MAMIndexesPage}
                            />
                            <Route
                                path={AppRoute.walletSettings + WalletSettingsRoute.battery}
                                component={BatteryPage}
                            />
                            <Route
                                path={AppRoute.walletSettings + WalletSettingsRoute.version}
                                component={WalletVersionPage}
                            />
                            <Route
                                path={AppRoute.walletSettings + WalletSettingsRoute.ledgerIndexes}
                                component={LedgerIndexesPage}
                            />
                            <Route
                                path={AppRoute.walletSettings + WalletSettingsRoute.twoFa}
                                component={TwoFAPage}
                            />
                            <Route
                                path={AppRoute.walletSettings + WalletSettingsRoute.notification}
                                component={Notifications}
                            />
                            {/* Wallet settings */}
                        </IonRouterOutlet>
                    </WalletLayoutBody>
                    {shouldDisplayFooter(location.pathname) && <MobileProFooter />}
                </WalletLayout>
                <PreferencesModal />
            </WideContent>
            <BackgroundElements />
        </WideLayout>
    );
};

const shouldDisplayFooter = (loc: string) => {
    return loc !== AppProRoute.dashboard && !loc.startsWith(AppRoute.browser);
};

const NavigateToRecovery = () => {
    const location = useLocation();

    const newPath = location.pathname.replace(AppRoute.settings, AppRoute.walletSettings);

    return <Navigate to={{ pathname: newPath, search: location.search }} replace={true} />;
};

const PreferencesModal = () => {
    const [presentingElement, setPresentingElement] = useState<HTMLElement | null>(null);

    const settingsHistory = useRef(
        createIsolatedMemoryHistory([
            { pathname: AppRoute.settings, search: '', hash: '', state: null }
        ])
    );

    useLayoutEffect(() => {
        setPresentingElement(document.getElementById('main-content'));
    }, []);

    const history = useHistory();
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    useEffect(() => {
        const unblock = history.block(location => {
            if (location.pathname?.startsWith(AppRoute.settings)) {
                setSettingsOpen(true);
                if (location.pathname !== AppRoute.settings) {
                    settingsHistory.current.push(location.pathname);
                }
                return false;
            }
            return undefined;
        });

        return () => unblock();
    }, [history]);

    const onClose = () => {
        setSettingsOpen(false);
        settingsHistory.current.push(AppRoute.settings);
    };

    return (
        <IonModal
            presentingElement={presentingElement!}
            isOpen={isSettingsOpen}
            onDidDismiss={onClose}
        >
            <IonContent>
                <IonReactMemoryRouter
                    history={
                        settingsHistory.current as unknown as ComponentProps<
                            typeof IonReactMemoryRouter
                        >['history']
                    }
                >
                    <IonRouterOutlet>
                        <Route path={AppRoute.settings} exact>
                            <MobileProPreferencesPage onClose={onClose} />
                        </Route>
                        <Route
                            path={AppRoute.settings + SettingsRoute.account}
                            component={DesktopManageAccountsPage}
                        />
                        <Route
                            path={AppRoute.settings + SettingsRoute.localization}
                            component={Localization}
                        />
                        <Route path={AppRoute.settings + SettingsRoute.legal} component={Legal} />
                        <Route
                            path={AppRoute.settings + SettingsRoute.theme}
                            component={UserTheme}
                        />
                        <Route
                            path={AppRoute.settings + SettingsRoute.dev}
                            component={DevSettings}
                        />
                        <Route
                            path={AppRoute.settings + SettingsRoute.fiat}
                            component={FiatCurrency}
                        />
                        <Route
                            path={AppRoute.settings + SettingsRoute.security}
                            component={SecuritySettings}
                        />
                        <Route
                            path={AppRoute.settings + SettingsRoute.country}
                            component={CountrySettings}
                        />
                        <Route
                            path={AppRoute.settings + SettingsRoute.pro}
                            component={ProSettings}
                        />
                        <Route
                            path={AppRoute.settings + SettingsRoute.recovery}
                            component={NavigateToRecovery}
                        />
                        <Route path={AppRoute.settings + SettingsRoute.version}>
                            <Redirect to={AppRoute.walletSettings + WalletSettingsRoute.version} />
                        </Route>
                        <Route path={AppRoute.settings + SettingsRoute.jettons}>
                            <Redirect to={AppRoute.walletSettings + WalletSettingsRoute.jettons} />
                        </Route>
                        <Route path={AppRoute.settings + SettingsRoute.twoFa}>
                            <Redirect to={AppRoute.walletSettings + WalletSettingsRoute.twoFa} />
                        </Route>
                    </IonRouterOutlet>
                </IonReactMemoryRouter>
            </IonContent>
        </IonModal>
    );
};

export const NarrowEnvGlobalStyles = createGlobalStyle`
    ${IonicOverride};
`;
