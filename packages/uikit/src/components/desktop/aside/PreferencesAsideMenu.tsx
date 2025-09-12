import { FC } from 'react';
import styled from 'styled-components';
import { useLocation } from 'react-router-dom';

import { AsideMenuItem } from '../../shared/AsideItem';
import { Body2, Body3, Label2, Label2Class } from '../../Text';
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
import { AppRoute, SettingsRoute } from '../../../libs/routes';
import { useTranslation } from '../../../hooks/translation';
import { useAppSdk } from '../../../hooks/appSdk';
import { useAppContext } from '../../../hooks/appContext';
import { DeleteAllNotification } from '../../settings/DeleteAccountNotification';
import { useDisclosure } from '../../../hooks/useDisclosure';
import { capitalize, getLanguageName } from '../../../libs/common';
import { Skeleton } from '../../shared/Skeleton';
import { useProState, useSupport } from '../../../state/pro';
import { useAvailableThemes, useUserUIPreferences } from '../../../state/theme';
import { hexToRGBA, hover } from '../../../libs/css';
import { useAccountsState, useActiveConfig } from '../../../state/wallet';
import { HideOnReview } from '../../ios/HideOnReview';
import { NavLink } from '../../shared/NavLink';
import { ForTargetEnv, NotForTargetEnv } from '../../shared/TargetEnv';
import { useNavigate } from '../../../hooks/router/useNavigate';
import { isProSubscription, isValidSubscription } from '@tonkeeper/core/dist/entries/pro';
import { useProFeaturesNotification } from '../../modals/ProFeaturesNotificationControlled';
import { Badge } from '../../shared';
import { createMultiTap } from '@tonkeeper/core/dist/utils/common';
import { useToast } from '../../../hooks/useNotification';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useDevMenuVisibility, useMutateDevMenuVisibility } from '../../../state/dev';

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
    const navigate = useNavigate();

    const isCoinPageOpened = location.pathname.startsWith(AppRoute.coins);

    const sdk = useAppSdk();
    const toast = useToast();
    const config = useActiveConfig();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const { data: subscription } = useProState();
    const { data: uiPreferences } = useUserUIPreferences();
    const { data: support } = useSupport();
    const { fiat } = useAppContext();
    const wallets = useAccountsState();
    const { data: isDevMenuVisible } = useDevMenuVisibility();
    const { mutate: setIsDevMenuVisible } = useMutateDevMenuVisibility();

    const { onOpen: onProPurchaseOpen } = useProFeaturesNotification();

    const availableThemes = useAvailableThemes();

    const isTonkeeperProActive = location.pathname === AppRoute.settings + SettingsRoute.pro;

    const handleTonkeeperProClick = async () => {
        if (isProSubscription(subscription)) {
            navigate(AppRoute.settings + SettingsRoute.pro);

            return;
        }

        onProPurchaseOpen();
    };

    const onFiveTaps = createMultiTap(async () => {
        setIsDevMenuVisible();
        await sdk.storage.set<boolean>(AppKey.IS_DEV_MENU_VISIBLE, true);
        toast('Dev Menu activated!');
    });

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
                <AsideMenuItemStyled
                    onClick={handleTonkeeperProClick}
                    isSelected={isTonkeeperProActive}
                >
                    <TonkeeperSkeletIcon />
                    <Label2>{t('tonkeeper_pro')}</Label2>
                </AsideMenuItemStyled>
                {isValidSubscription(subscription) && (
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

            <ForTargetEnv env="mobile">
                <AsideMenuItemsBlock>
                    <HideOnReview>
                        <AsideMenuItemStyled
                            onClick={() => config.faq_url && sdk.openPage(config.faq_url)}
                            isSelected={false}
                        >
                            <GlobeIcon />
                            <Label2>{t('preferences_aside_faq')}</Label2>
                        </AsideMenuItemStyled>
                    </HideOnReview>
                    <AsideMenuItemStyled
                        onClick={() => support.url && sdk.openPage(support.url)}
                        isSelected={false}
                    >
                        <TelegramIcon />
                        <PriorityButtonContent>
                            <PriorityLabelStyled>
                                {t('settings_support')}
                                {support.isPriority && <Badge size="s"> {t('priority')}</Badge>}
                            </PriorityLabelStyled>
                            {support.isPriority && (
                                <Body3Styled>{t('priority_support_description')}</Body3Styled>
                            )}
                        </PriorityButtonContent>
                    </AsideMenuItemStyled>
                    <HideOnReview>
                        {config.tonkeeperNewsUrl && (
                            <AsideMenuItemStyled
                                onClick={() =>
                                    config.tonkeeperNewsUrl && sdk.openPage(config.tonkeeperNewsUrl)
                                }
                                isSelected={false}
                            >
                                <TelegramIcon />
                                <Label2>{t('settings_news')}</Label2>
                            </AsideMenuItemStyled>
                        )}
                    </HideOnReview>
                </AsideMenuItemsBlock>
            </ForTargetEnv>

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
            {isDevMenuVisible && (
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
            )}
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
                    onClick={() => {
                        onFiveTaps();
                        sdk.copyToClipboard(
                            `Tonkeeper Pro for ${sdk.targetEnv} v${sdk.version}`,
                            t('copied')
                        );
                    }}
                >
                    <TonkeeperProOutlineIcon />
                    <Body2>Tonkeeper Pro {sdk.version}</Body2>
                </AsideMenuItemVersion>
            </AsideMenuItemsBlock>
        </PreferencesAsideContainer>
    );
};

const PriorityButtonContent = styled.div`
    display: flex;
    flex-direction: column;
`;

const PriorityLabelStyled = styled.div`
    ${Label2Class};

    display: flex;
    align-items: center;
    gap: 6px;
`;

const Body3Styled = styled(Body3)`
    color: ${({ theme }) => theme.textSecondary};
`;
