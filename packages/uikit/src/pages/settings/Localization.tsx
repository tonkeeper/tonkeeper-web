import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { CheckIcon } from '../../components/Icon';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useTranslation } from '../../hooks/translation';
import { getLanguageName } from '../../libs/common';
import { useMutateUserLanguage } from '../../state/language';
import { localizationFrom } from '@tonkeeper/core/dist/entries/language';

export const Localization = () => {
    const { t, i18n } = useTranslation();
    const { mutateAsync } = useMutateUserLanguage();

    const items = useMemo<SettingsItem[]>(() => {
        return i18n.languages.map(language => ({
            name: getLanguageName(language, language),
            secondary: getLanguageName(language, 'en'),
            icon: language === i18n.language ? <CheckIcon /> : undefined,
            action: () => mutateAsync(localizationFrom(language))
        }));
    }, [i18n.language, mutateAsync]);

    return (
        <>
            <SubHeader title={t('Localization')} />
            <InnerBody>
                <SettingsList items={items} />
            </InnerBody>
        </>
    );
};
