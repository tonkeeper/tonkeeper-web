import { Route, Switch } from 'react-router-dom';
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
    return (
        <Switch>
            <Route path={SettingsRoute.localization} component={Localization} />
            <Route path={SettingsRoute.legal} component={Legal} />
            <Route path={SettingsRoute.dev} component={DevSettings} />
            <Route path={SettingsRoute.fiat} component={FiatCurrency} />
            <Route path={SettingsRoute.account} component={Account} />
            <Route path={SettingsRoute.notification} component={Notifications} />
            <Route path={`${SettingsRoute.recovery}/:accountId`} component={Recovery} />
            <Route path={SettingsRoute.recovery} component={ActiveRecovery} exact />
            <Route path={SettingsRoute.version} component={WalletVersionPage} />
            <Route path={SettingsRoute.ledgerIndexes} component={LedgerIndexesPage} />
            <Route path={SettingsRoute.jettons} component={JettonsSettings} />
            <Route path={SettingsRoute.nft} component={NFTSettings} />
            <Route path={SettingsRoute.security} component={SecuritySettings} />
            <Route path={SettingsRoute.country} component={CountrySettings} />
            <Route path={SettingsRoute.pro} component={ProSettings} />
            <Route path={WalletSettingsRoute.connectedApps} component={ConnectedAppsSettings} />
            <Route path={WalletSettingsRoute.derivations} component={MAMIndexesPage} />
            <Route path={WalletSettingsRoute.battery} component={BatteryPage} />
            <Route path={WalletSettingsRoute.twoFa} component={TwoFAPage} />
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
