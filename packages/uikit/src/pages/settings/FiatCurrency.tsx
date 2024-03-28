import { FiatCurrencies, FiatCurrencySymbolsConfig } from '@tonkeeper/core/dist/entries/fiat';
import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { CheckIcon } from '../../components/Icon';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useMutateUserFiat } from '../../state/fiat';

export const FiatCurrency = () => {
    const { t, i18n } = useTranslation();

    const { fiat } = useAppContext();
    const { mutate } = useMutateUserFiat();

    const items = useMemo<SettingsItem[]>(() => {
        return Object.entries(FiatCurrencySymbolsConfig).map(([key]) => ({
            name: key,
            secondary:
                key === 'TON'
                    ? t('Toncoin')
                    : new Intl.DisplayNames([intlLocale(i18n.language)], { type: 'currency' }).of(
                          key
                      ),
            icon: key === fiat ? <CheckIcon /> : undefined,
            action: () => mutate(key as FiatCurrencies)
        }));
    }, [mutate, fiat, i18n.language]);

    return (
        <>
            <SubHeader title={t('settings_primary_currency')} />
            <InnerBody>
                <SettingsList items={items} />
            </InnerBody>
        </>
    );
};
