import { FiatCurrencies, FiatCurrencySymbolsConfig } from '@tonkeeper/core/dist/entries/fiat';
import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { CheckIcon, SpinnerIcon } from '../../components/Icon';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useAllowedFiatCurrencies, useMutateUserFiat } from '../../state/fiat';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { ForTargetEnv } from '../../components/shared/TargetEnv';
import styled from 'styled-components';

export const FiatCurrency = () => {
    const { t, i18n } = useTranslation();

    const { fiat } = useAppContext();
    const { mutate } = useMutateUserFiat();
    const isProDisplay = useIsFullWidthMode();
    const { data: allowedCurrencies } = useAllowedFiatCurrencies();

    const items = useMemo<SettingsItem[] | undefined>(() => {
        if (!allowedCurrencies) {
            return undefined;
        }
        return Object.entries(FiatCurrencySymbolsConfig)
            .filter(c => allowedCurrencies.includes(c[0]))
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
    }, [mutate, fiat, i18n.language, allowedCurrencies]);

    if (isProDisplay) {
        return (
            <DesktopViewPageLayout>
                <ForTargetEnv env="mobile">
                    <DesktopViewHeader>
                        <DesktopViewHeaderContent title={t('settings_primary_currency')} />
                    </DesktopViewHeader>
                </ForTargetEnv>
                {items ? (
                    <SettingsList items={items} />
                ) : (
                    <LoadingWrapper>
                        <SpinnerIcon />
                    </LoadingWrapper>
                )}
            </DesktopViewPageLayout>
        );
    }

    return (
        <>
            <SubHeader title={t('settings_primary_currency')} />
            <InnerBody>
                {items ? (
                    <SettingsList items={items} />
                ) : (
                    <LoadingWrapper>
                        <SpinnerIcon />
                    </LoadingWrapper>
                )}
            </InnerBody>
        </>
    );
};

const LoadingWrapper = styled.div`
    margin-top: 64px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: ${props => props.theme.iconTertiary};
`;
