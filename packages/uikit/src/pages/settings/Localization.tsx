import {
  localizationFrom,
  localizationSecondaryText,
} from '@tonkeeper/core/dist/entries/language';
import React, { useCallback, useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { CheckIcon } from '../../components/Icon';
import {
  SettingsItem,
  SettingsList,
} from '../../components/settings/SettingsList';
import { SubHeader } from '../../components/SubHeader';
import { useTranslation } from '../../hooks/translation';
import { useMutateWalletProperty } from '../../state/wallet';

export const Localization = () => {
  const { t, i18n } = useTranslation();
  const { mutateAsync } = useMutateWalletProperty();
  const onChange = useCallback(
    async (lang: string) => {
      await i18n.reloadResources([lang]);
      await i18n.changeLanguage(lang);
      await mutateAsync({ lang: localizationFrom(lang) });
    },
    [mutateAsync]
  );

  const items = useMemo<SettingsItem[]>(() => {
    return i18n.languages.map((language) => ({
      name: language.toUpperCase(),
      secondary: localizationSecondaryText(localizationFrom(language)),
      icon: language === i18n.language ? <CheckIcon /> : undefined,
      action: () => onChange(language),
    }));
  }, [i18n.language, onChange]);

  return (
    <>
      <SubHeader title={t('Localization')} />
      <InnerBody>
        <SettingsList items={items} />
      </InnerBody>
    </>
  );
};
