import { Redirect, Route, Switch, useLocation } from 'react-router-dom';
import { ProSettings } from '../../components/settings/ProSettings';
import { AppRoute, SettingsRoute, WalletSettingsRoute } from '../../libs/routes';
import { Localization } from '../../pages/settings/Localization';
import { Legal } from '../../pages/settings/Legal';
import { UserTheme } from '../../pages/settings/Theme';
import { DevSettings } from '../../pages/settings/Dev';
import { FiatCurrency } from '../../pages/settings/FiatCurrency';
import { Notifications } from '../../pages/settings/Notification';
import { CountrySettings } from '../../pages/settings/Country';
import styled from 'styled-components';
import { SecuritySettings } from '../../pages/settings/Security';
import { DesktopManageAccountsPage } from '../settings/DesktopManageWalletsSettings';
import { Navigate } from '../../components/shared/Navigate';

const OldSettingsLayoutWrapper = styled.div`
    padding-top: 64px;
    position: relative;

    & .settings-header-back-button {
        display: none;
    }
`;

export const DesktopPreferencesRouting = () => {
    return (
        <Switch>
            <Route path={SettingsRoute.account} component={DesktopManageAccountsPage} />

            <Route
                path={[
                    SettingsRoute.localization,
                    SettingsRoute.legal,
                    SettingsRoute.theme,
                    SettingsRoute.dev,
                    SettingsRoute.fiat,
                    SettingsRoute.notification,
                    SettingsRoute.recovery,
                    SettingsRoute.version,
                    SettingsRoute.jettons,
                    SettingsRoute.twoFa,
                    SettingsRoute.security,
                    SettingsRoute.country,
                    SettingsRoute.pro
                ]}
                render={() => (
                    <OldSettingsLayoutWrapper>
                        <Switch>
                            <Route path={SettingsRoute.localization} component={Localization} />
                            <Route path={SettingsRoute.legal} component={Legal} />
                            <Route path={SettingsRoute.theme} component={UserTheme} />
                            <Route path={SettingsRoute.dev} component={DevSettings} />
                            <Route path={SettingsRoute.fiat} component={FiatCurrency} />
                            <Route path={SettingsRoute.notification} component={Notifications} />
                            <Route path={SettingsRoute.recovery} component={NavigateToRecovery} />
                            <Route path={SettingsRoute.version}>
                                <Redirect
                                    to={AppRoute.walletSettings + WalletSettingsRoute.version}
                                />
                            </Route>
                            <Route path={SettingsRoute.jettons}>
                                <Redirect
                                    to={AppRoute.walletSettings + WalletSettingsRoute.jettons}
                                />
                            </Route>
                            <Route path={SettingsRoute.twoFa}>
                                <Redirect
                                    to={AppRoute.walletSettings + WalletSettingsRoute.twoFa}
                                />
                            </Route>
                            <Route path={SettingsRoute.security} component={SecuritySettings} />
                            <Route path={SettingsRoute.country} component={CountrySettings} />
                            <Route path={SettingsRoute.pro} component={ProSettings} />
                            <Route
                                path="*"
                                render={() => <Redirect to={SettingsRoute.account} />}
                            />
                        </Switch>
                    </OldSettingsLayoutWrapper>
                )}
            />

            <Route path="*" render={() => <Redirect to={SettingsRoute.account} />} />
        </Switch>
    );
};
const NavigateToRecovery = () => {
    const location = useLocation();

    const newPath = location.pathname.replace(AppRoute.settings, AppRoute.walletSettings);

    return <Navigate to={{ pathname: newPath, search: location.search }} replace={true} />;
};
