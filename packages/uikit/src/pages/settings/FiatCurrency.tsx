import {
  FiatCurrencies,
  FiatCurrencySymbolsConfig,
} from '@tonkeeper/core/dist/entries/fiat';
import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { CheckIcon } from '../../components/Icon';
import {
  SettingsItem,
  SettingsList,
} from '../../components/settings/SettingsList';
import { SubHeader } from '../../components/SubHeader';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useMutateWalletProperty } from '../../state/wallet';

export const FiatCurrency = () => {
  const { t } = useTranslation();

  const { fiat } = useAppContext();
  const { mutate } = useMutateWalletProperty();

  const items = useMemo<SettingsItem[]>(() => {
    return Object.entries(FiatCurrencySymbolsConfig).map(([key, value]) => ({
      name: key,
      secondary: t(`choose_currency_currencies_${key}`),
      icon: key === fiat ? <CheckIcon /> : undefined,
      action: () => mutate({ fiat: key as FiatCurrencies }),
    }));
  }, [mutate, fiat]);

  return (
    <>
      <SubHeader title={t('settings_primary_currency')} />
      <InnerBody>
        <SettingsList items={items} />
      </InnerBody>
    </>
  );
};
