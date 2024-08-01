import { Route, Routes } from 'react-router-dom';
import { InnerBody } from '../../components/Body';
import { SettingsHeader } from '../../components/Header';
import { ProSettings } from '../../components/settings/ProSettings';
import { SettingsRoute, WalletSettingsRoute } from '../../libs/routes';
import { Account } from './Account';
import { CountrySettings } from './Country';
import { DevSettings } from './Dev';
import { FiatCurrency } from './FiatCurrency';
import { JettonsSettings } from './Jettons';
import { Legal } from './Legal';
import { Localization } from './Localization';
import { Notifications } from './Notification';
import { ActiveRecovery, Recovery } from './Recovery';
import { SecuritySettings } from './Security';
import { Settings } from './Settings';
import { WalletVersionPage } from './Version';
import { ConnectedAppsSettings } from './ConnectedAppsSettings';
import { NFTSettings } from './Nft';
import { LedgerIndexesPage } from "./LedgerIndexes";

const SettingsRouter = () => {
    return (
        <Routes>
            <Route path={SettingsRoute.localization} element={<Localization />} />
            <Route path={SettingsRoute.legal} element={<Legal />} />
            <Route path={SettingsRoute.dev} element={<DevSettings />} />
            <Route path={SettingsRoute.fiat} element={<FiatCurrency />} />
            <Route path={SettingsRoute.account} element={<Account />} />
            <Route path={SettingsRoute.notification} element={<Notifications />} />
            <Route path={SettingsRoute.recovery}>
                <Route path=":accountId" element={<Recovery />} />
                <Route index element={<ActiveRecovery />} />
            </Route>
            <Route path={SettingsRoute.version} element={<WalletVersionPage />} />
            <Route path={SettingsRoute.ledgerIndexes} element={<LedgerIndexesPage />} />
            <Route path={SettingsRoute.jettons} element={<JettonsSettings />} />
            <Route path={SettingsRoute.nft} element={<NFTSettings />} />
            <Route path={SettingsRoute.security} element={<SecuritySettings />} />
            <Route path={SettingsRoute.country} element={<CountrySettings />} />
            <Route path={SettingsRoute.pro} element={<ProSettings />} />
            <Route path={WalletSettingsRoute.connectedApps} element={<ConnectedAppsSettings />} />
            <Route
                path="*"
                element={
                    <>
                        <SettingsHeader />
                        <InnerBody>
                            <Settings />
                        </InnerBody>
                    </>
                }
            />
        </Routes>
    );
};

export default SettingsRouter;
