import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { ProSettings } from '../../components/settings/ProSettings';
import { SettingsRoute } from '../../libs/routes';
import { Localization } from '../../pages/settings/Localization';
import { Legal } from '../../pages/settings/Legal';
import { UserTheme } from '../../pages/settings/Theme';
import { DevSettings } from '../../pages/settings/Dev';
import { FiatCurrency } from '../../pages/settings/FiatCurrency';
import { Account } from '../../pages/settings/Account';
import { Notifications } from '../../pages/settings/Notification';
import { ActiveRecovery, Recovery } from '../../pages/settings/Recovery';
import { WalletVersion } from '../../pages/settings/Version';
import { JettonsSettings } from '../../pages/settings/Jettons';
import { SecuritySettings } from '../../pages/settings/Security';
import { CountrySettings } from '../../pages/settings/Country';
import styled from 'styled-components';

const OldSettingsLayoutWrapper = styled.div`
    padding-top: 64px;
    position: relative;
`;

const OldSettingsLayout = () => {
    return (
        <OldSettingsLayoutWrapper>
            <Outlet />
        </OldSettingsLayoutWrapper>
    );
};

export const DesktopPreferencesRouting = () => {
    return (
        <Routes>
            <Route element={<OldSettingsLayout />}>
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
                <Route path={SettingsRoute.pro} element={<ProSettings />} />
                <Route path="*" element={<Navigate to={'.' + SettingsRoute.account} replace />} />
            </Route>
        </Routes>
    );
};
