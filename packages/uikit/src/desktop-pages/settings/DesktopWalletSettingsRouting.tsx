import { Outlet, Route, Routes } from 'react-router-dom';
import { SettingsRoute } from '../../libs/routes';
import { ActiveRecovery, Recovery } from '../../pages/settings/Recovery';
import { WalletVersion } from '../../pages/settings/Version';
import { JettonsSettings } from '../../pages/settings/Jettons';
import { SecuritySettings } from '../../pages/settings/Security';
import styled from 'styled-components';
import { DesktopWalletSettingsPage } from './DesktopWalletSettingsPage';

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

export const DesktopWalletSettingsRouting = () => {
    return (
        <Routes>
            <Route element={<OldSettingsLayout />}>
                <Route path={SettingsRoute.recovery}>
                    <Route path=":publicKey" element={<Recovery />} />
                    <Route index element={<ActiveRecovery />} />
                </Route>
                <Route path={SettingsRoute.version} element={<WalletVersion />} />
                <Route path={SettingsRoute.jettons} element={<JettonsSettings />} />
                <Route path={SettingsRoute.security} element={<SecuritySettings />} />
            </Route>
            <Route path="*" element={<DesktopWalletSettingsPage />} />
        </Routes>
    );
};
