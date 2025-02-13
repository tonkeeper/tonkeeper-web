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
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { ForTargetEnv } from '../../components/shared/TargetEnv';

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
                <ForTargetEnv env="mobile">
                    <DesktopViewHeader>
                        <DesktopViewHeaderContent title={t('Theme')} />
                    </DesktopViewHeader>
                </ForTargetEnv>
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
