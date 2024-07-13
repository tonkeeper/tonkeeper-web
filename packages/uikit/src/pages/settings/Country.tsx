import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import country from 'country-list-js';
import React, { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { CheckIcon } from '../../components/Icon';
import { SubHeader } from '../../components/SubHeader';
import { CountryIcon } from '../../components/fields/RoundedButton';
import { Input } from '../../components/fields/Input';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useTranslation } from '../../hooks/translation';
import { useAutoCountry, useCountrySetting, useMutateUserCountry } from '../../state/country';

const Block = styled.div`
    margin-bottom: 32px;
`;

export const CountrySettings = () => {
    const { t, i18n } = useTranslation();

    const { data: selected } = useCountrySetting();
    const { data: detected } = useAutoCountry();
    const { mutate } = useMutateUserCountry();

    let [searchParams, setSearchParams] = useSearchParams();

    const search = useMemo(() => {
        return new URLSearchParams(searchParams).get('search') ?? '';
    }, [searchParams]);

    const setSearch = useCallback(
        (search: string) => {
            setSearchParams({ search }, { replace: true });
        },
        [setSearchParams]
    );

    const autoItem = useMemo<SettingsItem[]>(() => {
        return [
            {
                name: t('auto'),
                preIcon: detected ? <CountryIcon country={detected} /> : undefined,
                icon: selected == null ? <CheckIcon /> : undefined,
                action: () => mutate(undefined)
            }
        ];
    }, [t, selected, detected, mutate]);

    const countries = useMemo<SettingsItem[]>(() => {
        return Object.entries(country.all)
            .filter(([key, value]) =>
                (value as any).name.toLowerCase().includes(search.trim().toLowerCase())
            )
            .map(([key, value]) => {
                return {
                    name:
                        new Intl.DisplayNames([intlLocale(i18n.language)], { type: 'region' }).of(
                            key
                        ) ?? (value as any).name,
                    preIcon: <CountryIcon country={key} />,
                    icon: selected == key ? <CheckIcon /> : undefined,
                    action: () => mutate(key)
                };
            });
    }, [selected, mutate, search]);

    return (
        <>
            <SubHeader title={t('country')} />
            <InnerBody>
                <Block>
                    <Input
                        value={search}
                        onChange={setSearch}
                        label={t('settings_search_engine')}
                        clearButton
                    />
                </Block>
                <SettingsList items={autoItem} />
                <SettingsList items={countries} />
            </InnerBody>
        </>
    );
};
