import { Redirect, Route, Switch, useLocation, useRouteMatch } from 'react-router-dom';
import { ProSettings } from '../../components/settings/ProSettings';
import { AppRoute, SettingsRoute, WalletSettingsRoute } from '../../libs/routes';
import { Localization } from '../../pages/settings/Localization';
import { Legal } from '../../pages/settings/Legal';
import { UserTheme } from '../../pages/settings/Theme';
import { DevSettings } from '../../pages/settings/Dev';
import { FiatCurrency } from '../../pages/settings/FiatCurrency';
import { Notifications } from '../../pages/settings/Notification';
import { CountrySettings } from '../../pages/settings/Country';
import { SecuritySettings } from '../../pages/settings/Security';
import { DesktopManageAccountsPage } from '../settings/DesktopManageWalletsSettings';
import { Navigate } from '../../components/shared/Navigate';

export const DesktopPreferencesRouting = () => {
    const { path } = useRouteMatch();

    return (
        <Switch>
            <Route path={path + SettingsRoute.account} component={DesktopManageAccountsPage} />
            <Route path={path + SettingsRoute.localization} component={Localization} />
            <Route path={path + SettingsRoute.legal} component={Legal} />
            <Route path={path + SettingsRoute.theme} component={UserTheme} />
            <Route path={path + SettingsRoute.dev} component={DevSettings} />
            <Route path={path + SettingsRoute.fiat} component={FiatCurrency} />
            <Route path={path + SettingsRoute.notification} component={Notifications} />
            <Route path={path + SettingsRoute.recovery} component={NavigateToRecovery} />
            <Route path={path + SettingsRoute.version}>
                <Redirect to={AppRoute.walletSettings + WalletSettingsRoute.version} />
            </Route>
            <Route path={path + SettingsRoute.jettons}>
                <Redirect to={AppRoute.walletSettings + WalletSettingsRoute.jettons} />
            </Route>
            <Route path={path + SettingsRoute.twoFa}>
                <Redirect to={AppRoute.walletSettings + WalletSettingsRoute.twoFa} />
            </Route>
            <Route path={path + SettingsRoute.security} component={SecuritySettings} />
            <Route path={path + SettingsRoute.country} component={CountrySettings} />
            <Route path={path + SettingsRoute.pro} component={ProSettings} />
            <Route
                path="*"
                render={() => <Redirect to={AppRoute.settings + SettingsRoute.account} />}
            />
        </Switch>
    );
};
const NavigateToRecovery = () => {
    const location = useLocation();

    const newPath = location.pathname.replace(AppRoute.settings, AppRoute.walletSettings);

    return <Navigate to={{ pathname: newPath, search: location.search }} replace={true} />;
};
