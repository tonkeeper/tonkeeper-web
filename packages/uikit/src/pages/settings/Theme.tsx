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

export const UserTheme = () => {
    const { t } = useTranslation();

    const { data: uiPreferences } = useUserUIPreferences();
    const { mutateAsync } = useMutateUserUIPreferences();

    const items: SettingsItem[] = Object.keys(availableThemes).map(name => ({
        name: capitalize(name),
        icon: uiPreferences?.theme === name ? <CheckIcon /> : undefined,
        action: () => mutateAsync({ theme: name as 'dark' | 'pro' })
    }));

    return (
        <>
            <SubHeader title={t('Theme')} />
            <InnerBody>
                <SettingsList items={items} loading={!!uiPreferences} />
            </InnerBody>
        </>
    );
};
