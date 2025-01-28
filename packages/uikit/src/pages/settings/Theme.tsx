import React from 'react';
import { InnerBody } from '../../components/Body';
import { CheckIcon } from '../../components/Icon';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { SubHeader } from '../../components/SubHeader';
import { useTranslation } from '../../hooks/translation';
import {
    availableThemes,
    useMutateUserUIPreferences,
    useUserUIPreferences
} from '../../state/theme';
import { capitalize } from '../../libs/common';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';

export const UserTheme = () => {
    const { t } = useTranslation();

    const { data: uiPreferences } = useUserUIPreferences();
    const { mutateAsync } = useMutateUserUIPreferences();
    const isProDisplay = useIsFullWidthMode();

    const items: SettingsItem[] = Object.keys(availableThemes).map(name => ({
        name: capitalize(name),
        icon: uiPreferences?.theme === name ? <CheckIcon /> : undefined,
        action: () => mutateAsync({ theme: name as 'dark' | 'pro' })
    }));

    if (isProDisplay) {
        return (
            <DesktopViewPageLayout>
                <SettingsList items={items} />
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('Theme')} />
            <InnerBody>
                <SettingsList items={items} loading={!!uiPreferences} />
            </InnerBody>
        </>
    );
};
