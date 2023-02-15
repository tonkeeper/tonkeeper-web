import { Theme } from '@tonkeeper/core/dist/entries/theme';
import React, { useCallback, useMemo } from 'react';
import { CheckIcon } from '../../components/Icon';
import {
  SettingsItem,
  SettingsList,
} from '../../components/settings/SettingsList';
import { SubHeader } from '../../components/SubHeader';
import { useTranslation } from '../../hooks/translation';
import { useMutateTheme, useUserTheme, useUserThemes } from '../../state/theme';

export const UserTheme = () => {
  const { t } = useTranslation();

  const { data: theme } = useUserTheme();
  const { data: themes, isFetching } = useUserThemes();
  const { mutateAsync } = useMutateTheme();

  const onChange = useCallback(
    async (theme: Theme) => {
      await mutateAsync(theme);
    },
    [mutateAsync]
  );

  const items = useMemo<SettingsItem[]>(() => {
    return (themes ?? []).map((item) => ({
      name: item.name,
      secondary: item.color,
      icon: theme?.color === item.color ? <CheckIcon /> : undefined,
      action: () => onChange(item),
    }));
  }, [themes, theme]);

  return (
    <>
      <SubHeader title={t('Theme')} />
      <SettingsList items={items} loading={isFetching} />
    </>
  );
};
