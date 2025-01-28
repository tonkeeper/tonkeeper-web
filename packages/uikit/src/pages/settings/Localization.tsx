import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { CheckIcon } from '../../components/Icon';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useTranslation } from '../../hooks/translation';
import { getLanguageName } from '../../libs/common';
import { useMutateUserLanguage } from '../../state/language';
import { localizationFrom } from '@tonkeeper/core/dist/entries/language';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';

export const Localization = () => {
    const { t, i18n } = useTranslation();
    const { mutateAsync } = useMutateUserLanguage();
    const isProDisplay = useIsFullWidthMode();

    const items = useMemo<SettingsItem[]>(() => {
        return i18n.languages.map(language => ({
            name: getLanguageName(language, language),
            secondary: getLanguageName(language, 'en'),
            icon: language === i18n.language ? <CheckIcon /> : undefined,
            action: () => mutateAsync(localizationFrom(language))
        }));
    }, [i18n.language, mutateAsync]);

    if (isProDisplay) {
        return (
            <DesktopViewPageLayout>
                <SettingsList items={items} />
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('Localization')} />
            <InnerBody>
                <SettingsList items={items} />
            </InnerBody>
        </>
    );
};
