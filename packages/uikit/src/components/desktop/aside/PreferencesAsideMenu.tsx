import styled from 'styled-components';
import { AsideMenuItem } from '../../shared/AsideItem';
import { Body2, Body3, Label2 } from '../../Text';
import {
    AppearanceIcon,
    AppleIcon,
    BankIcon,
    CodeIcon,
    DocIcon,
    EnvelopeIcon,
    ExitIcon,
    GlobeIcon,
    LockIcon,
    SlidersIcon,
    TelegramIcon,
    TonkeeperProOutlineIcon,
    TonkeeperSkeletIcon
} from '../../Icon';
import { useLocation } from 'react-router-dom';
import { AppRoute, SettingsRoute } from '../../../libs/routes';
import { useTranslation } from '../../../hooks/translation';
import { useAppSdk } from '../../../hooks/appSdk';
import { useAppContext } from '../../../hooks/appContext';
import { DeleteAllNotification } from '../../settings/DeleteAccountNotification';
import React, { FC } from 'react';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { capitalize, getLanguageName } from '../../../libs/common';
import { Skeleton } from '../../shared/Skeleton';
import { useProState } from '../../../state/pro';
import { useAvailableThemes, useUserUIPreferences } from '../../../state/theme';
import { hexToRGBA, hover } from '../../../libs/css';
import { useAccountsState, useActiveConfig } from '../../../state/wallet';
import { HideOnReview } from '../../ios/HideOnReview';
import { NavLink } from '../../shared/NavLink';
import { ForTargetEnv, NotForTargetEnv } from '../../shared/TargetEnv';

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
    background: ${p =>
        p.isSelected && p.theme.proDisplayType !== 'mobile'
            ? p.theme.backgroundContentTint
            : 'unset'};
    padding-right: 50px;

    svg {
        color: ${p => p.theme.iconSecondary};
    }
`;

const AsideMenuItemVersion = styled(AsideMenuItemStyled)`
    color: ${p => p.theme.textTertiary};
    transition: color 0.15s ease-in-out;

    svg {
        color: ${p => p.theme.iconTertiary};
        transition: color 0.15s ease-in-out;
    }

    ${p =>
        p.theme.proDisplayType !== 'mobile' &&
        hover`
             background: unset;
             
             color: ${p.theme.textSecondary};
             svg {
                 color: ${p.theme.iconSecondary};
        `}
`;

const AsideMenuItemLarge = styled(AsideMenuItemStyled)`
    height: 48px;
    max-height: 48px;
`;

const AsideMenuItemLargeBody = styled.div`
    display: flex;
    flex-direction: column;
    text-align: start;

    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const AsideMenuItemsBlock = styled.div`
    padding: 0.5rem;
`;

export const PreferencesAsideMenu: FC<{ className?: string }> = ({ className }) => {
    const { t, i18n } = useTranslation();
    const location = useLocation();

    const isCoinPageOpened = location.pathname.startsWith(AppRoute.coins);

    const sdk = useAppSdk();
    const config = useActiveConfig();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { data: proState } = useProState();
    const { data: uiPreferences } = useUserUIPreferences();
    const { fiat } = useAppContext();
    const wallets = useAccountsState();

    const availableThemes = useAvailableThemes();

    return (
        <PreferencesAsideContainer className={className}>
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
                <HideOnReview>
                    <NavLink to={AppRoute.settings + SettingsRoute.pro}>
                        {({ isActive }) => (
                            <AsideMenuItemStyled isSelected={isActive}>
                                <TonkeeperSkeletIcon />
                                <Label2>{t('tonkeeper_pro')}</Label2>
                            </AsideMenuItemStyled>
                        )}
                    </NavLink>
                </HideOnReview>
                {proState?.subscription.valid && (
                    <NavLink to={AppRoute.settings + SettingsRoute.theme}>
                        {({ isActive }) => (
                            <AsideMenuItemLarge isSelected={isActive}>
                                <AppearanceIcon />
                                <AsideMenuItemLargeBody>
                                    <Label2>{t('preferences_aside_theme')}</Label2>
                                    <Body3>
                                        {!uiPreferences ? (
                                            <Skeleton width="60px" height="14px" margin="3px 0" />
                                        ) : (
                                            capitalize(
                                                uiPreferences.theme ||
                                                    Object.keys(availableThemes)[0]
                                            )
                                        )}
                                    </Body3>
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
                                <Body3>{getLanguageName(i18n.language)}</Body3>
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
                                <Body3>{fiat}</Body3>
                            </AsideMenuItemLargeBody>
                        </AsideMenuItemLarge>
                    )}
                </NavLink>
            </AsideMenuItemsBlock>

            <HideOnReview>
                <ForTargetEnv env="mobile">
                    <AsideMenuItemsBlock>
                        <AsideMenuItemStyled
                            onClick={() => config.faq_url && sdk.openPage(config.faq_url)}
                            isSelected={false}
                        >
                            <GlobeIcon />
                            <Label2>{t('preferences_aside_faq')}</Label2>
                        </AsideMenuItemStyled>
                        <AsideMenuItemStyled
                            onClick={() =>
                                config.directSupportUrl && sdk.openPage(config.directSupportUrl)
                            }
                            isSelected={false}
                        >
                            <TelegramIcon />
                            <Label2>{t('settings_support')}</Label2>
                        </AsideMenuItemStyled>
                        <AsideMenuItemStyled
                            onClick={() =>
                                config.tonkeeperNewsUrl && sdk.openPage(config.tonkeeperNewsUrl)
                            }
                            isSelected={false}
                        >
                            <TelegramIcon />
                            <Label2>{t('settings_news')}</Label2>
                        </AsideMenuItemStyled>
                    </AsideMenuItemsBlock>
                </ForTargetEnv>
            </HideOnReview>

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
                <NotForTargetEnv env="mobile">
                    <AsideMenuItemStyled
                        onClick={() =>
                            config.pro_landing_url && sdk.openPage(config.pro_landing_url)
                        }
                        isSelected={false}
                    >
                        <AppleIcon />
                        <Label2>{t('settings_pro_ios')}</Label2>
                    </AsideMenuItemStyled>
                </NotForTargetEnv>
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
            <AsideMenuItemsBlock>
                <AsideMenuItemVersion
                    isSelected={false}
                    onClick={() =>
                        sdk.copyToClipboard(
                            `Tonkeeper Pro for ${sdk.targetEnv} v${sdk.version}`,
                            t('copied')
                        )
                    }
                >
                    <TonkeeperProOutlineIcon />
                    <Body2>Tonkeeper Pro {sdk.version}</Body2>
                </AsideMenuItemVersion>
            </AsideMenuItemsBlock>
        </PreferencesAsideContainer>
    );
};
