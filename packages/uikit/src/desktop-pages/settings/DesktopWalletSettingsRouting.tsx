import { Outlet, Route, Routes } from 'react-router-dom';
import { WalletSettingsRoute } from '../../libs/routes';
import { ActiveRecovery, Recovery } from '../../pages/settings/Recovery';
import { WalletVersion } from '../../pages/settings/Version';
import { JettonsSettings } from '../../pages/settings/Jettons';
import styled from 'styled-components';
import { DesktopWalletSettingsPage } from './DesktopWalletSettingsPage';
import { DesktopConnectedAppsSettings } from './DesktopConnectedAppsSettings';

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
                <Route path={WalletSettingsRoute.recovery}>
                    <Route path=":publicKey" element={<Recovery />} />
                    <Route index element={<ActiveRecovery />} />
                </Route>
                <Route path={WalletSettingsRoute.version} element={<WalletVersion />} />
                <Route path={WalletSettingsRoute.jettons} element={<JettonsSettings />} />
            </Route>
            <Route
                path={WalletSettingsRoute.connectedApps}
                element={<DesktopConnectedAppsSettings />}
            />
            <Route path="*" element={<DesktopWalletSettingsPage />} />
        </Routes>
    );
};
