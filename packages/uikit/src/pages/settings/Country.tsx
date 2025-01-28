import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import country from 'country-list-js';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { InnerBody } from '../../components/Body';
import { CheckIcon } from '../../components/Icon';
import { SubHeader } from '../../components/SubHeader';
import { CountryIcon } from '../../components/fields/RoundedButton';
import { Input } from '../../components/fields/Input';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useTranslation } from '../../hooks/translation';
import { useAutoCountry, useCountrySetting, useMutateUserCountry } from '../../state/country';
import { useSearchParams } from '../../hooks/router/useSearchParams';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';

const Block = styled.div`
    margin-bottom: 32px;
`;

const DesktopBlock = styled.div`
    padding: 1rem;
    position: sticky;
    top: 0;
    background: ${p => p.theme.backgroundPage};
    z-index: 1;
`;

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    display: initial;
`;

export const CountrySettings = () => {
    const { t, i18n } = useTranslation();

    const { data: selected } = useCountrySetting();
    const { data: detected } = useAutoCountry();
    const { mutate } = useMutateUserCountry();
    const isProDisplay = useIsFullWidthMode();

    const [searchParams, setSearchParams] = useSearchParams();

    const search = useMemo(() => {
        return new URLSearchParams(searchParams).get('search') ?? '';
    }, [searchParams]);

    const setSearch = useCallback(
        (s: string) => {
            setSearchParams({ search: s }, { replace: true });
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
            .filter(([_, value]) =>
                (value as any).name.toLowerCase().includes(search.trim().toLowerCase())
            )
            .map(([key, value]) => {
                return {
                    name:
                        new Intl.DisplayNames([intlLocale(i18n.language)], { type: 'region' }).of(
                            key
                        ) ?? (value as any).name,
                    preIcon: <CountryIcon country={key} />,
                    icon: selected === key ? <CheckIcon /> : undefined,
                    action: () => mutate(key)
                };
            });
    }, [selected, mutate, search]);

    const desktopItems = useMemo(() => autoItem.concat(countries), [countries, autoItem]);

    if (isProDisplay) {
        return (
            <DesktopViewPageLayoutStyled>
                <DesktopBlock>
                    <Input
                        size="small"
                        id="country-search"
                        value={search}
                        onChange={setSearch}
                        label={t('settings_search_engine')}
                        clearButton
                    />
                </DesktopBlock>
                <SettingsList items={desktopItems} />
            </DesktopViewPageLayoutStyled>
        );
    }

    return (
        <>
            <SubHeader title={t('country')} />
            <InnerBody>
                <Block>
                    <Input
                        id="country-search"
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
