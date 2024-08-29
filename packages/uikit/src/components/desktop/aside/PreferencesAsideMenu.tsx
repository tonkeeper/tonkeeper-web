import styled from 'styled-components';
import { AsideMenuItem } from '../../shared/AsideItem';
import { Body2, Label2 } from '../../Text';
import {
    AppearanceIcon,
    BankIcon,
    CodeIcon,
    DocIcon,
    EnvelopeIcon,
    ExitIcon,
    GlobeIcon,
    LockIcon,
    PlaceIcon,
    SlidersIcon,
    TonkeeperSkeletIcon
} from '../../Icon';
import { NavLink, useLocation } from 'react-router-dom';
import { AppRoute, SettingsRoute } from '../../../libs/routes';
import { useTranslation } from '../../../hooks/translation';
import { useAppSdk } from '../../../hooks/appSdk';
import { useAppContext } from '../../../hooks/appContext';
import { DeleteAllNotification } from '../../settings/DeleteAccountNotification';
import React from 'react';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { capitalize, getCountryName, getLanguageName } from '../../../libs/common';
import { useCountrySetting } from '../../../state/country';
import { Skeleton } from '../../shared/Skeleton';
import { useProState } from '../../../state/pro';
import { availableThemes, useUserUIPreferences } from '../../../state/theme';
import { hexToRGBA } from '../../../libs/css';
import { useAccountsState } from '../../../state/wallet';

const PreferencesAsideContainer = styled.div`
    width: fit-content;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border-right: 1px solid ${p => p.theme.backgroundContentAttention};
    background: ${p => hexToRGBA(p.theme.backgroundContent, 0.56)};

    a {
        text-decoration: unset;
        color: unset;
    }

    * {
        user-select: none;
    }
`;

const AsideMenuItemStyled = styled(AsideMenuItem)`
    background: ${p => (p.isSelected ? p.theme.backgroundContentTint : 'unset')};
    padding-right: 50px;

    svg {
        color: ${p => p.theme.iconSecondary};
    }
`;

const AsideMenuItemLarge = styled(AsideMenuItemStyled)`
    height: 48px;
    max-height: 48px;
`;

const AsideMenuItemLargeBody = styled.div`
    display: flex;
    flex-direction: column;
    text-align: start;

    ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
`;

const AsideMenuItemsBlock = styled.div`
    padding: 0.5rem;
`;

export const PreferencesAsideMenu = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();

    const isCoinPageOpened = location.pathname.startsWith(AppRoute.coins);

    const sdk = useAppSdk();
    const { config } = useAppContext();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { data: countryData } = useCountrySetting();
    const country = countryData === null ? t('auto') : countryData;
    const { data: proState } = useProState();
    const { data: uiPreferences } = useUserUIPreferences();
    const { fiat } = useAppContext();
    const wallets = useAccountsState();

    return (
        <PreferencesAsideContainer>
            <AsideMenuItemsBlock>
                <NavLink to={AppRoute.settings + SettingsRoute.account}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive || isCoinPageOpened}>
                            <SlidersIcon />
                            <Label2>{t('Manage_wallets')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
                <NavLink to={AppRoute.settings + SettingsRoute.security}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive || isCoinPageOpened}>
                            <LockIcon />
                            <Label2>{t('settings_security')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
                <NavLink to={AppRoute.settings + SettingsRoute.pro}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive}>
                            <TonkeeperSkeletIcon />
                            <Label2>{t('tonkeeper_pro')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
                {proState?.subscription.valid && (
                    <NavLink to={AppRoute.settings + SettingsRoute.theme}>
                        {({ isActive }) => (
                            <AsideMenuItemLarge isSelected={isActive}>
                                <AppearanceIcon />
                                <AsideMenuItemLargeBody>
                                    <Label2>{t('preferences_aside_theme')}</Label2>
                                    <Body2>
                                        {!uiPreferences ? (
                                            <Skeleton width="60px" height="14px" margin="3px 0" />
                                        ) : (
                                            capitalize(
                                                uiPreferences.theme ||
                                                    Object.keys(availableThemes)[0]
                                            )
                                        )}
                                    </Body2>
                                </AsideMenuItemLargeBody>
                            </AsideMenuItemLarge>
                        )}
                    </NavLink>
                )}
                <NavLink to={AppRoute.settings + SettingsRoute.localization}>
                    {({ isActive }) => (
                        <AsideMenuItemLarge isSelected={isActive}>
                            <GlobeIcon />
                            <AsideMenuItemLargeBody>
                                <Label2>{t('Localization')}</Label2>
                                <Body2>{getLanguageName(i18n.language)}</Body2>
                            </AsideMenuItemLargeBody>
                        </AsideMenuItemLarge>
                    )}
                </NavLink>
                <NavLink to={AppRoute.settings + SettingsRoute.fiat}>
                    {({ isActive }) => (
                        <AsideMenuItemLarge isSelected={isActive}>
                            <BankIcon />
                            <AsideMenuItemLargeBody>
                                <Label2>{t('settings_primary_currency')}</Label2>
                                <Body2>{fiat}</Body2>
                            </AsideMenuItemLargeBody>
                        </AsideMenuItemLarge>
                    )}
                </NavLink>
                <NavLink to={AppRoute.settings + SettingsRoute.country}>
                    {({ isActive }) => (
                        <AsideMenuItemLarge isSelected={isActive}>
                            <PlaceIcon />
                            <AsideMenuItemLargeBody>
                                <Label2>{t('country')}</Label2>
                                <Body2>
                                    {!country ? (
                                        <Skeleton width="60px" height="14px" margin="3px 0" />
                                    ) : (
                                        getCountryName(i18n.language, country)
                                    )}
                                </Body2>
                            </AsideMenuItemLargeBody>
                        </AsideMenuItemLarge>
                    )}
                </NavLink>
            </AsideMenuItemsBlock>

            <AsideMenuItemsBlock>
                <AsideMenuItemStyled
                    onClick={() => config.supportLink && sdk.openPage(config.supportLink)}
                    isSelected={false}
                >
                    <EnvelopeIcon />
                    <Label2>{t('settings_contact_support')}</Label2>
                </AsideMenuItemStyled>
                <NavLink to={AppRoute.settings + SettingsRoute.legal}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive}>
                            <DocIcon />
                            <Label2>{t('settings_legal_documents')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
            </AsideMenuItemsBlock>
            <AsideMenuItemsBlock>
                <NavLink to={AppRoute.settings + SettingsRoute.dev}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive}>
                            <CodeIcon />
                            <Label2>{t('preferences_aside_dev_menu')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
            </AsideMenuItemsBlock>
            <AsideMenuItemsBlock>
                <AsideMenuItemStyled onClick={onOpen} isSelected={false}>
                    <ExitIcon />
                    <Label2>
                        {wallets.length > 1
                            ? t('preferences_aside_sign_out_all')
                            : t('preferences_aside_sign_out')}
                    </Label2>
                </AsideMenuItemStyled>
                <DeleteAllNotification open={isOpen} handleClose={onClose} />
            </AsideMenuItemsBlock>
        </PreferencesAsideContainer>
    );
};
