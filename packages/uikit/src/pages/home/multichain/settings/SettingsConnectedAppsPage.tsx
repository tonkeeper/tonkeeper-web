import { FC } from 'react';

import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute } from '../../../../libs/routes';
import { BrowserConnectedView } from '../browser/BrowserConnectedView';
import { SettingsPageLayout } from './SettingsPageLayout';

/**
 * Connected Apps settings screen: the active wallet's dApp connections
 * across TonConnect, WalletConnect and injected EVM. The list, empty
 * state and disconnect flows all live in {@link BrowserConnectedView} —
 * this page only frames it in the settings chrome.
 */
export const SettingsConnectedAppsPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <SettingsPageLayout
            compact={compact}
            title={t('settings_connected_apps')}
            onBack={() => navigate(MultichainRoute.settings)}
        >
            <div className="px-4 pb-4">
                <BrowserConnectedView />
            </div>
        </SettingsPageLayout>
    );
};
