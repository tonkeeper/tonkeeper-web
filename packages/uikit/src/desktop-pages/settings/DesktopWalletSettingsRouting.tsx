import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { WalletSettingsRoute } from '../../libs/routes';
import { ActiveRecovery, Recovery } from '../../pages/settings/Recovery';
import { WalletVersionPage } from '../../pages/settings/Version';
import styled from 'styled-components';
import { DesktopWalletSettingsPage } from './DesktopWalletSettingsPage';
import { DesktopConnectedAppsSettings } from './DesktopConnectedAppsSettings';
import { DesktopNftSettings } from './DesktopNftSettings';
import { MAMIndexesPage } from '../../pages/settings/MamIndexes';
import { LedgerIndexesPage } from '../../pages/settings/LedgerIndexes';
import { BatteryPage } from '../../pages/settings/Battery';
import { Notifications } from '../../pages/settings/Notification';
import { TwoFAPage } from '../../pages/settings/TwoFA';
import { JettonsSettings } from '../../pages/settings/Jettons';

const OldSettingsLayoutWrapper = styled.div`
    padding-top: 64px;
    position: relative;
`;

export const DesktopWalletSettingsRouting = () => {
    const { path } = useRouteMatch();

    return (
        <Switch>
            <Route
                path={[path + WalletSettingsRoute.recovery]}
                render={() => {
                    return (
                        <OldSettingsLayoutWrapper>
                            <Switch>
                                <Route
                                    path={path + `${WalletSettingsRoute.recovery}/:accountId`}
                                    component={Recovery}
                                />
                                <Route
                                    path={path + WalletSettingsRoute.recovery}
                                    component={ActiveRecovery}
                                    exact
                                />
                            </Switch>
                        </OldSettingsLayoutWrapper>
                    );
                }}
            />
            <Route
                path={path + WalletSettingsRoute.connectedApps}
                component={DesktopConnectedAppsSettings}
            />
            <Route path={path + WalletSettingsRoute.jettons} component={JettonsSettings} />
            <Route path={path + WalletSettingsRoute.nft} component={DesktopNftSettings} />
            <Route path={path + WalletSettingsRoute.derivations} component={MAMIndexesPage} />
            <Route path={path + WalletSettingsRoute.battery} component={BatteryPage} />
            <Route path={path + WalletSettingsRoute.version} component={WalletVersionPage} />
            <Route path={path + WalletSettingsRoute.ledgerIndexes} component={LedgerIndexesPage} />
            <Route path={path + WalletSettingsRoute.twoFa} component={TwoFAPage} />
            <Route path={path + WalletSettingsRoute.notification} component={Notifications} />
            <Route path="*" component={DesktopWalletSettingsPage} />
        </Switch>
    );
};
