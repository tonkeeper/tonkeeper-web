import { ComponentProps, FC, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { Route, useHistory, useLocation } from 'react-router-dom';
import { useWindowsScroll } from '@tonkeeper/uikit/dist/components/Body';
import { useAppWidth } from '../../libs/hooks';
import { useTrackLocation } from '@tonkeeper/uikit/dist/hooks/analytics';
import { useDebuggingTools } from '@tonkeeper/uikit/dist/hooks/useDebuggingTools';
import {
    AppProRoute,
    AppRoute,
    DevSettingsRoute,
    SettingsRoute,
    WalletSettingsRoute
} from '@tonkeeper/uikit/dist/libs/routes';
import { DesktopMultiSendPage } from '@tonkeeper/uikit/dist/desktop-pages/multi-send';
import DesktopAccountSettingsPage from '@tonkeeper/uikit/dist/desktop-pages/settings/DesktopAccountSettingsPage';
import { DesktopCollectables } from '@tonkeeper/uikit/dist/desktop-pages/nft/DesktopCollectables';
import { DesktopDns } from '@tonkeeper/uikit/dist/desktop-pages/nft/DesktopDns';
import { DesktopCoinPage } from '@tonkeeper/uikit/dist/desktop-pages/coin/DesktopCoinPage';
import { DesktopManageMultisigsPage } from '@tonkeeper/uikit/dist/desktop-pages/manage-multisig-wallets/DesktopManageMultisigs';
import { DesktopMultisigOrdersPage } from '@tonkeeper/uikit/dist/desktop-pages/multisig-orders/DesktopMultisigOrders';
import { DesktopSwapPage } from '@tonkeeper/uikit/dist/desktop-pages/swap';
import styled, { createGlobalStyle } from 'styled-components';
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
import { DevSettings, DevSettingsLogs } from '@tonkeeper/uikit/dist/pages/settings/Dev';
import { FiatCurrency } from '@tonkeeper/uikit/dist/pages/settings/FiatCurrency';
import { SecuritySettings } from '@tonkeeper/uikit/dist/pages/settings/Security';
import { IonReactMemoryRouter } from '@ionic/react-router';
import { createIsolatedMemoryHistory } from '../../libs/isolated-memory-history';
import { SplashScreen } from '@capacitor/splash-screen';
import { useAllChainsAssetsWithPrice } from '@tonkeeper/uikit/dist/state/home';
import { MobileProWelcomePage } from '@tonkeeper/uikit/dist/mobile-pro-pages/MobileProWelcomePage';
import { MobileProCreatePasswordPage } from '@tonkeeper/uikit/dist/mobile-pro-pages/MobileProCreatePasswordPage';
import { useKeychainSecuritySettings } from '@tonkeeper/uikit/dist/state/password';
import {
    useAccountsState,
    useActiveAccountQuery,
    useMutateDeleteAll
} from '@tonkeeper/uikit/dist/state/wallet';
import { useAtom } from '@tonkeeper/uikit/dist/libs/useAtom';
import { ionRouterAnimation$, useNavigate } from '@tonkeeper/uikit/dist/hooks/router/useNavigate';
import { AnimatePresence, motion } from 'framer-motion';
import { MobileProPin } from '@tonkeeper/uikit/dist/components/mobile-pro/pin/MobileProPin';
import { useTranslation } from 'react-i18next';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useRealtimeUpdatesInvalidation } from '@tonkeeper/uikit/dist/hooks/realtime';
import { Button } from '@tonkeeper/uikit';
import { MobileDappBrowserController } from '../components/dapp-browser/MobileDappBrowserController';
import { ProSubscriptionSettings } from '@tonkeeper/uikit/dist/components/settings/ProSubscriptionSettings';

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
    useWindowsScroll();
    useAppWidth();
    useTrackLocation();
    usePrefetch();
    useDebuggingTools();
    useRealtimeUpdatesInvalidation();

    const { password } = useKeychainSecuritySettings();
    const accountQuery = useActiveAccountQuery();

    if (lock) {
        return <NarrowContentInitialPagesLock />;
    }

    if (!activeAccount || !password || !accountQuery.data) {
        return <NarrowContentInitialPages accountIsCreated={!!activeAccount} />;
    }

    return <NarrowContentAppRouting />;
};

const UnlockPageStyled = styled.div`
    position: relative;
    padding-bottom: env(safe-area-inset-bottom);
    height: 100%;
    box-sizing: border-box;

    > button {
        z-index: 2;
        position: absolute;
        top: calc(1rem + env(safe-area-inset-top));
        right: 1rem;
    }
`;

const NarrowContentInitialPagesLock = () => {
    const { t } = useTranslation();
    const { biometry } = useKeychainSecuritySettings();
    const sdk = useAppSdk();
    const [faceIdValidation, setFaceIdValidation] = useState<'success' | 'error' | undefined>();

    useEffect(() => {
        SplashScreen.hide();
    }, []);

    useEffect(() => {
        if (biometry) {
            sdk.keychain
                ?.securityCheck('biometry')
                .then(() => {
                    setFaceIdValidation('success');
                    setTimeout(() => sdk.uiEvents.emit('unlock'), 200);
                })
                .catch(() => {
                    setFaceIdValidation('error');
                    setTimeout(() => setFaceIdValidation(undefined), 200);
                });
        }
    }, [biometry]);

    const { mutateAsync: mutateLogOut } = useMutateDeleteAll();
    const accounts = useAccountsState();
    const hasSeveralAccounts = accounts.length > 1;
    const onLogOut = async () => {
        const confirmed = await sdk.confirm({
            title: `🚧🚨🚨🚨🚧\n${t(
                hasSeveralAccounts ? 'settings_reset_alert_title_all' : 'settings_reset_alert_title'
            )}`,
            message: t(hasSeveralAccounts ? 'logout_on_unlock_many' : 'logout_on_unlock_one'),
            cancelButtonTitle: t('cancel'),
            okButtonTitle: t('settings_reset')
        });

        if (confirmed) {
            await mutateLogOut();
        }
    };

    return (
        <UnlockPageStyled>
            <Button secondary onClick={onLogOut}>
                {t('settings_reset')}
            </Button>
            <MobileProPin
                title={t('enter_password')}
                validated={faceIdValidation}
                onSubmit={async v => {
                    if (await sdk.keychain!.checkPassword(v)) {
                        setTimeout(() => {
                            sdk.uiEvents.emit('unlock');
                        }, 200);
                        return true;
                    } else {
                        return false;
                    }
                }}
            />
        </UnlockPageStyled>
    );
};

const NarrowContentInitialPages: FC<{
    accountIsCreated: boolean;
}> = ({ accountIsCreated }) => {
    useEffect(() => {
        SplashScreen.hide();
    }, []);

    if (!accountIsCreated) {
        return <MobileProWelcomePage />;
    }

    return <MobileProCreatePasswordPage />;
};

const NarrowContentAppRouting = () => {
    const location = useLocation();

    const { assets } = useAllChainsAssetsWithPrice();
    const isSplashHidden = useRef(false);
    const isReady = assets !== undefined;
    useEffect(() => {
        if (isReady && !isSplashHidden.current) {
            isSplashHidden.current = true;
            SplashScreen.hide();
        }
    }, [isReady]);

    const [animated] = useAtom(ionRouterAnimation$);

    return (
        <WideLayout>
            <WideContent id="main-id--">
                <WalletLayout $gradient={location.pathname === AppRoute.home}>
                    <WalletLayoutBody>
                        <IonMenu menuId="aside-nav" contentId="main-content" type="overlay">
                            <AsideMenu />
                        </IonMenu>
                        <MobileProWalletMenu />
                        {/* Ionic doesn't support nested routing well */}
                        <IonRouterOutlet id="main-content" animated={animated}>
                            <Route path={AppProRoute.dashboard}>
                                <Navigate replace to={AppRoute.home} />
                            </Route>
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
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={shouldDisplayFooter(location.pathname).toString()}
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            transition={{ duration: 0.1, ease: 'easeOut' }}
                        >
                            {shouldDisplayFooter(location.pathname) && <MobileProFooter />}
                        </motion.div>
                    </AnimatePresence>
                </WalletLayout>
                <PreferencesModal />
            </WideContent>
            <BackgroundElements />
            <MobileDappBrowserController />
        </WideLayout>
    );
};

const shouldDisplayFooter = (loc: string) => {
    return loc !== AppProRoute.dashboard;
};

const NavigateToRecovery = () => {
    const location = useLocation();

    const newPath = location.pathname.replace(AppRoute.settings, AppRoute.walletSettings);

    return <Navigate to={{ pathname: newPath, search: location.search }} replace={true} />;
};

const IonModalStyled = styled(IonModal)`
    &::part(container) {
        background-color: ${p => p.theme.backgroundContent};
    }
`;

const routesToRedirectToWalletsSettings = [
    AppRoute.settings + WalletSettingsRoute.version,
    AppRoute.settings + WalletSettingsRoute.twoFa,
    AppRoute.settings + WalletSettingsRoute.jettons
];

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
    const navigate = useNavigate();
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    useEffect(() => {
        const unblock = history.block(location => {
            const matchingRedirectionRoute = routesToRedirectToWalletsSettings.find(r =>
                location.pathname?.startsWith(r)
            );

            if (matchingRedirectionRoute) {
                const newPath = location.pathname.replace(
                    AppRoute.settings,
                    AppRoute.walletSettings
                );
                navigate(newPath, { disableMobileAnimation: true });
                return false;
            }

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
    }, [history, navigate]);

    useEffect(() => {
        settingsHistory.current.listen(location => {
            if (!location.pathname.startsWith(AppRoute.settings)) {
                onClose();
                history.push(location.pathname);
            }
        });
    }, [history]);

    const onClose = () => {
        setSettingsOpen(false);
        settingsHistory.current.push(AppRoute.settings);
    };

    return (
        <IonModalStyled
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
                            exact
                        />
                        <Route
                            path={AppRoute.settings + SettingsRoute.dev + DevSettingsRoute.logs}
                            component={DevSettingsLogs}
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
                            path={AppRoute.settings + SettingsRoute.pro}
                            component={ProSubscriptionSettings}
                        />
                        <Route
                            path={AppRoute.settings + SettingsRoute.recovery}
                            component={NavigateToRecovery}
                        />
                    </IonRouterOutlet>
                </IonReactMemoryRouter>
            </IonContent>
        </IonModalStyled>
    );
};

export const NarrowEnvGlobalStyles = createGlobalStyle`
    ${IonicOverride};
    
    body {
        &.dapp-browser-open {
            background: transparent !important;

            #main-content, ion-modal:not(.on-top-of-browser) {
                z-index: 0 !important;
                opacity: 0;
                background: transparent;
            }
        }
    }
`;
