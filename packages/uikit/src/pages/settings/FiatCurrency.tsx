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
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { ForTargetEnv } from '../../components/shared/TargetEnv';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';

export const FiatCurrency = () => {
    const { t, i18n } = useTranslation();

    const { fiat } = useAppContext();
    const { mutate } = useMutateUserFiat();
    const isProDisplay = useIsFullWidthMode();
    const rubEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.RUB);

    const items = useMemo<SettingsItem[]>(() => {
        return Object.entries(FiatCurrencySymbolsConfig)
            .filter(c => c[0] !== FiatCurrencies.RUB || rubEnabled)
            .map(([key]) => ({
                name: key,
                secondary:
                    key === 'TON'
                        ? t('Toncoin')
                        : new Intl.DisplayNames([intlLocale(i18n.language)], {
                              type: 'currency'
                          }).of(key),
                icon: key === fiat ? <CheckIcon /> : undefined,
                action: () => mutate(key as FiatCurrencies)
            }));
    }, [mutate, fiat, i18n.language, rubEnabled]);

    if (isProDisplay) {
        return (
            <DesktopViewPageLayout>
                <ForTargetEnv env="mobile">
                    <DesktopViewHeader>
                        <DesktopViewHeaderContent title={t('settings_primary_currency')} />
                    </DesktopViewHeader>
                </ForTargetEnv>
                <SettingsList items={items} />
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('settings_primary_currency')} />
            <InnerBody>
                <SettingsList items={items} />
            </InnerBody>
        </>
    );
};
