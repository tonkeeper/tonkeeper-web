import { Outlet, Route, Routes } from 'react-router-dom';
import { WalletSettingsRoute } from '../../libs/routes';
import { ActiveRecovery, Recovery } from '../../pages/settings/Recovery';
import { WalletVersionPage } from '../../pages/settings/Version';
import { JettonsSettings } from '../../pages/settings/Jettons';
import styled from 'styled-components';
import { DesktopWalletSettingsPage } from './DesktopWalletSettingsPage';
import { DesktopConnectedAppsSettings } from './DesktopConnectedAppsSettings';
import { DesktopNftSettings } from './DesktopNftSettings';
import { LedgerIndexesPage } from '../../pages/settings/LedgerIndexes';

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
                    <Route path=":accountId" element={<Recovery />} />
                    <Route index element={<ActiveRecovery />} />
                </Route>
                <Route path={WalletSettingsRoute.version} element={<WalletVersionPage />} />
                <Route path={WalletSettingsRoute.ledgerIndexes} element={<LedgerIndexesPage />} />
                <Route path={WalletSettingsRoute.jettons} element={<JettonsSettings />} />
            </Route>
            <Route
                path={WalletSettingsRoute.connectedApps}
                element={<DesktopConnectedAppsSettings />}
            />
            <Route path={WalletSettingsRoute.nft} element={<DesktopNftSettings />} />
            <Route path="*" element={<DesktopWalletSettingsPage />} />
        </Routes>
    );
};
