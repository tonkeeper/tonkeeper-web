import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { InnerBody } from '../../components/Body';
import { SettingsHeader } from '../../components/Header';
import { ProSettings } from '../../components/settings/ProSettings';
import { SettingsRoute, WalletSettingsRoute } from '../../libs/routes';
import { Account } from './Account';
import { ConnectedAppsSettings } from './ConnectedAppsSettings';
import { CountrySettings } from './Country';
import { DevSettings } from './Dev';
import { FiatCurrency } from './FiatCurrency';
import { JettonsSettings } from './Jettons';
import { LedgerIndexesPage } from './LedgerIndexes';
import { Legal } from './Legal';
import { Localization } from './Localization';
import { MAMIndexesPage } from './MamIndexes';
import { NFTSettings } from './Nft';
import { Notifications } from './Notification';
import { ActiveRecovery, Recovery } from './Recovery';
import { SecuritySettings } from './Security';
import { Settings } from './Settings';
import { WalletVersionPage } from './Version';
import { BatteryPage } from './Battery';
import { TwoFAPage } from './TwoFA';

const SettingsRouter = () => {
    const { path } = useRouteMatch();
    return (
        <Switch>
            <Route path={path + SettingsRoute.localization} component={Localization} />
            <Route path={path + SettingsRoute.legal} component={Legal} />
            <Route path={path + SettingsRoute.dev} component={DevSettings} />
            <Route path={path + SettingsRoute.fiat} component={FiatCurrency} />
            <Route path={path + SettingsRoute.account} component={Account} />
            <Route path={path + SettingsRoute.notification} component={Notifications} />
            <Route path={path + `${SettingsRoute.recovery}/:accountId`} component={Recovery} />
            <Route path={path + SettingsRoute.recovery} component={ActiveRecovery} exact />
            <Route path={path + SettingsRoute.version} component={WalletVersionPage} />
            <Route path={path + SettingsRoute.ledgerIndexes} component={LedgerIndexesPage} />
            <Route path={path + SettingsRoute.jettons} component={JettonsSettings} />
            <Route path={path + SettingsRoute.nft} component={NFTSettings} />
            <Route path={path + SettingsRoute.security} component={SecuritySettings} />
            <Route path={path + SettingsRoute.country} component={CountrySettings} />
            <Route path={path + SettingsRoute.pro} component={ProSettings} />
            <Route
                path={path + WalletSettingsRoute.connectedApps}
                component={ConnectedAppsSettings}
            />
            <Route path={path + WalletSettingsRoute.derivations} component={MAMIndexesPage} />
            <Route path={path + WalletSettingsRoute.battery} component={BatteryPage} />
            <Route path={path + WalletSettingsRoute.twoFa} component={TwoFAPage} />
            <Route
                path="*"
                render={() => (
                    <>
                        <SettingsHeader />
                        <InnerBody>
                            <Settings />
                        </InnerBody>
                    </>
                )}
            />
        </Switch>
    );
};

export default SettingsRouter;
