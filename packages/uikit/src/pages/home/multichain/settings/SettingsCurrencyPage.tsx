import { FC, useMemo, useState } from 'react';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';

import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute } from '../../../../libs/routes';
import {
    useMutateUserFiat,
    useSupportedCurrencies,
    useUserFiatQuery
} from '../../../../state/fiat';
import { SearchField } from '../../../../primitives/SearchField';
import { ModalCenterError, ModalCenterState } from '../../../../components/shared/ModalCenterState';
import IcDonemarkOutline28 from '../../../../icons/components/IcDonemarkOutline28';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import IcMagnifyingGlass28 from '../../../../icons/components/IcMagnifyingGlass28';
import { SettingsListCell, SettingsListGroup } from './SettingsList';
import { SettingsPageLayout } from './SettingsPageLayout';

/**
 * Primary currency picker. Selecting a currency persists it immediately and
 * keeps the user on the page so the choice is visible in place.
 */
export const SettingsCurrencyPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { data: fiat } = useUserFiatQuery();
    const { mutate } = useMutateUserFiat();
    const { data: supported, isError, refetch } = useSupportedCurrencies();
    const [search, setSearch] = useState('');

    const currencies = useMemo(() => {
        const displayCode = (code: string) =>
            code === FiatCurrencies.GRAM ? BRAND_CONFIG.coinSymbol : code;
        const entries = (supported ?? []).map(currency => {
            const code = currency.code.toUpperCase();
            return { code, title: displayCode(code), subtitle: currency.name };
        });
        if (supported && fiat && !entries.some(entry => entry.code === fiat)) {
            entries.unshift({ code: fiat, title: displayCode(fiat), subtitle: displayCode(fiat) });
        }
        return entries;
    }, [supported, fiat]);

    const query = search.trim().toLowerCase();
    const visible = useMemo(
        () =>
            query
                ? currencies.filter(
                      c =>
                          c.title.toLowerCase().includes(query) ||
                          c.subtitle.toLowerCase().includes(query)
                  )
                : currencies,
        [currencies, query]
    );

    return (
        <SettingsPageLayout
            compact={compact}
            title={t('settings_primary_currency')}
            onBack={() => navigate(MultichainRoute.settings)}
        >
            <div className="flex flex-col gap-4 px-4 pb-4">
                <SearchField
                    value={search}
                    onChange={setSearch}
                    placeholder={t('currency_picker_search_placeholder')}
                    className="!p-0"
                />
                {isError && !supported ? (
                    <ModalCenterError
                        icon={<IcExclamationmarkCircle28 />}
                        onRetry={() => refetch()}
                    />
                ) : query && visible.length === 0 ? (
                    <ModalCenterState
                        icon={<IcMagnifyingGlass28 />}
                        title={t('not_found_title')}
                        subtitle={t('search_no_results', { query: search.trim() })}
                    />
                ) : visible.length > 0 ? (
                    <SettingsListGroup>
                        {visible.map(currency => (
                            <SettingsListCell
                                key={currency.code}
                                title={currency.title}
                                subtitle={currency.subtitle}
                                rightIcon={
                                    currency.code === fiat ? <IcDonemarkOutline28 /> : undefined
                                }
                                onClick={() => mutate(currency.code as FiatCurrencies)}
                            />
                        ))}
                    </SettingsListGroup>
                ) : null}
            </div>
        </SettingsPageLayout>
    );
};
