import { FC } from 'react';
import { localizationFrom } from '@tonkeeper/core/dist/entries/language';

import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { getLanguageName } from '../../../../libs/common';
import { MultichainRoute } from '../../../../libs/routes';
import { useMutateUserLanguage } from '../../../../state/language';
import IcDonemarkOutline28 from '../../../../icons/components/IcDonemarkOutline28';
import { SettingsListCell, SettingsListGroup } from './SettingsList';
import { SettingsPageLayout } from './SettingsPageLayout';

/**
 * Language picker rows: native language name as title, English name as
 * subtitle. Selecting a language applies it immediately and stays on the page.
 */
export const SettingsLanguagePageView: FC<{
    compact?: boolean;
    languages: string[];
    selected: string;
    onSelect: (language: string) => void;
    onBack: () => void;
}> = ({ compact = false, languages, selected, onSelect, onBack }) => {
    const { t } = useTranslation();

    return (
        <SettingsPageLayout compact={compact} title={t('settings_language')} onBack={onBack}>
            <div className="px-4 pb-4">
                <SettingsListGroup>
                    {languages.map(language => (
                        <SettingsListCell
                            key={language}
                            title={getLanguageName(language, language)}
                            subtitle={getLanguageName(language, 'en')}
                            rightIcon={language === selected ? <IcDonemarkOutline28 /> : undefined}
                            onClick={() => onSelect(language)}
                        />
                    ))}
                </SettingsListGroup>
            </div>
        </SettingsPageLayout>
    );
};

export const SettingsLanguagePage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const { mutateAsync } = useMutateUserLanguage();

    return (
        <SettingsLanguagePageView
            compact={compact}
            languages={i18n.languages}
            selected={i18n.language}
            onSelect={language => mutateAsync(localizationFrom(language))}
            onBack={() => navigate(MultichainRoute.settings)}
        />
    );
};
