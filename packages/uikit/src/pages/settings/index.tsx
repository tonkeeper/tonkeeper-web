import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { InnerBody } from '../../components/Body';
import { SettingsHeader } from '../../components/Header';
import { SettingsRoute } from '../../libs/routes';
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
import { UserTheme } from './Theme';
import { WalletVersion } from './Version';

const SettingsRouter = () => {
    return (
        <Routes>
            <Route path={SettingsRoute.localization} element={<Localization />} />
            <Route path={SettingsRoute.legal} element={<Legal />} />
            <Route path={SettingsRoute.theme} element={<UserTheme />} />
            <Route path={SettingsRoute.dev} element={<DevSettings />} />
            <Route path={SettingsRoute.fiat} element={<FiatCurrency />} />
            <Route path={SettingsRoute.account} element={<Account />} />
            <Route path={SettingsRoute.notification} element={<Notifications />} />
            <Route path={SettingsRoute.recovery}>
                <Route path=":publicKey" element={<Recovery />} />
                <Route index element={<ActiveRecovery />} />
            </Route>
            <Route path={SettingsRoute.version} element={<WalletVersion />} />
            <Route path={SettingsRoute.jettons} element={<JettonsSettings />} />
            <Route path={SettingsRoute.security} element={<SecuritySettings />} />
            <Route path={SettingsRoute.country} element={<CountrySettings />} />
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
