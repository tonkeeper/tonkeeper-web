import { FC } from 'react';
import { Route, Switch } from 'react-router-dom';

import { MultichainRoute, MultichainSettingsRoute } from '../../../../libs/routes';
import { MultichainSettingsPage } from './MultichainSettingsPage';
import { SettingsCustomizePage } from './SettingsCustomizePage';
import { SettingsBackupPage } from './SettingsBackupPage';
import { MigrationPage } from './MigrationPage';
import { MigrationConfirmPage } from './MigrationConfirmPage';
import { SettingsCurrencyPage } from './SettingsCurrencyPage';
import { SettingsInterceptLinksPage } from './SettingsInterceptLinksPage';
import { SettingsLanguagePage } from './SettingsLanguagePage';
import { SettingsSecurityPage } from './SettingsSecurityPage';
import { SettingsNotificationsPage } from './SettingsNotificationsPage';
import { SettingsConnectedAppsPage } from './SettingsConnectedAppsPage';
import { SettingsBatteryRoute } from './SettingsBatteryRoute';
import { SettingsLegalPage } from './SettingsLegalPage';
import { SettingsDevPage } from './SettingsDevPage';

const route = (sub: MultichainSettingsRoute) => MultichainRoute.settings + sub;

/**
 * All settings screens of the multichain shell. Shells mount this once
 * under {@link MultichainRoute.settings}.
 */
export const MultichainSettingsRouting: FC<{ compact?: boolean }> = ({ compact }) => (
    <Switch>
        <Route path={route(MultichainSettingsRoute.customize)}>
            <SettingsCustomizePage compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.backup)}>
            <SettingsBackupPage compact={compact} />
        </Route>
        {/* Before `migration` — the picker route matches this path's prefix. */}
        <Route path={route(MultichainSettingsRoute.migrationConfirm)}>
            <MigrationConfirmPage compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.migration)}>
            <MigrationPage compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.currency)}>
            <SettingsCurrencyPage compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.interceptLinks)}>
            <SettingsInterceptLinksPage compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.language)}>
            <SettingsLanguagePage compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.security)}>
            <SettingsSecurityPage compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.notifications)}>
            <SettingsNotificationsPage compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.connectedApps)}>
            <SettingsConnectedAppsPage compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.battery)}>
            <SettingsBatteryRoute compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.legal)}>
            <SettingsLegalPage compact={compact} />
        </Route>
        <Route path={route(MultichainSettingsRoute.dev)}>
            <SettingsDevPage compact={compact} />
        </Route>
        <Route path="*">
            <MultichainSettingsPage compact={compact} />
        </Route>
    </Switch>
);
