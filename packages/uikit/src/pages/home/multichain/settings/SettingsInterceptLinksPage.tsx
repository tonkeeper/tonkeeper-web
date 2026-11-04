import { FC } from 'react';
import { InterceptTonLinksConfig } from '@tonkeeper/core/dist/service/globalPreferencesService';

import { useAppSdk } from '../../../../hooks/appSdk';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute } from '../../../../libs/routes';
import {
    useGlobalPreferences,
    useMutateGlobalPreferences
} from '../../../../state/global-preferences';
import { Navigate } from '../../../../components/shared/Navigate';
import IcDonemarkOutline28 from '../../../../icons/components/IcDonemarkOutline28';
import { SettingsListCell, SettingsListGroup } from './SettingsList';
import { SettingsPageLayout } from './SettingsPageLayout';

export const INTERCEPT_LINKS_OPTION_TITLES: Record<InterceptTonLinksConfig, string> = {
    always: 'settings_intercept_links_option_open_extension',
    never: 'settings_intercept_links_option_open_browser',
    ask: 'settings_intercept_links_option_ask'
};

/**
 * Transfer-links behaviour picker, shown only on shells with a links
 * interceptor (the extension). Selecting an option persists it
 * immediately and keeps the user on the page.
 */
export const SettingsInterceptLinksPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const sdk = useAppSdk();
    const { interceptTonLinks } = useGlobalPreferences();
    const { mutate } = useMutateGlobalPreferences();

    if (!sdk.linksInterceptorAvailable) {
        return <Navigate to={MultichainRoute.settings} />;
    }

    return (
        <SettingsPageLayout
            compact={compact}
            title={t('settings_intercept_links')}
            onBack={() => navigate(MultichainRoute.settings)}
        >
            <div className="px-4 pb-4">
                <SettingsListGroup>
                    {(Object.keys(INTERCEPT_LINKS_OPTION_TITLES) as InterceptTonLinksConfig[]).map(
                        option => (
                            <SettingsListCell
                                key={option}
                                title={t(INTERCEPT_LINKS_OPTION_TITLES[option])}
                                rightIcon={
                                    option === interceptTonLinks ? (
                                        <IcDonemarkOutline28 />
                                    ) : undefined
                                }
                                onClick={() => {
                                    if (option !== interceptTonLinks) {
                                        mutate({ interceptTonLinks: option });
                                    }
                                }}
                            />
                        )
                    )}
                </SettingsListGroup>
                <div className="px-4 pt-2 text-body2 text-textSecondary">
                    {t('settings_intercept_links_help_text')}
                </div>
            </div>
        </SettingsPageLayout>
    );
};
