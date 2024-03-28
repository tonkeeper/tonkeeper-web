import {
    DesktopViewDivider,
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { useTranslation } from '../../hooks/translation';
import styled from 'styled-components';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useWalletContext } from '../../hooks/appContext';
import { Body3, Label2 } from '../../components/Text';
import { CoinsIcon, ExitIcon, KeyIcon, SwitchIcon } from '../../components/Icon';
import React from 'react';
import { walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { RenameWalletNotification } from '../../components/settings/wallet-name/WalletNameNotification';
import { useDisclosure } from '../../hooks/useDisclosure';
import { Link } from 'react-router-dom';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';
import { LogOutWalletNotification } from '../../components/settings/LogOutNotification';

const SettingsListBlock = styled.div`
    padding: 0.5rem 0;
`;

const SettingsListItem = styled.div`
    padding: 10px 1rem;
    display: flex;
    gap: 12px;
    align-items: center;

    transition: background-color 0.2s ease-in-out;
    cursor: pointer;
    &:hover {
        background-color: ${p => p.theme.backgroundContentTint};
    }
`;

const SettingsListText = styled.div`
    display: flex;
    flex-direction: column;
    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const LinkStyled = styled(Link)`
    text-decoration: unset;
    color: unset;
`;

export const DesktopWalletSettingsPage = () => {
    const { t } = useTranslation();
    const wallet = useWalletContext();
    const { isOpen: isRenameOpen, onClose: onRenameClose, onOpen: onRenameOpen } = useDisclosure();
    const { isOpen: isLogoutOpen, onClose: onLogoutClose, onOpen: onLogoutOpen } = useDisclosure();

    return (
        <DesktopViewPageLayout>
            <DesktopViewHeader borderBottom>{t('settings_title')}</DesktopViewHeader>
            <SettingsListBlock>
                <SettingsListItem onClick={onRenameOpen}>
                    <WalletEmoji containerSize="16px" emojiSize="16px" emoji={wallet.emoji} />
                    <SettingsListText>
                        <Label2>{wallet.name || t('wallet_title')}</Label2>
                        <Body3>{t('customize')}</Body3>
                    </SettingsListText>
                </SettingsListItem>
            </SettingsListBlock>
            <DesktopViewDivider />
            <SettingsListBlock>
                <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.recovery}>
                    <SettingsListItem>
                        <KeyIcon />
                        <Label2>{t('settings_backup_seed')}</Label2>
                    </SettingsListItem>
                </LinkStyled>
                <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.version}>
                    <SettingsListItem>
                        <SwitchIcon />
                        <SettingsListText>
                            <Label2>{t('settings_wallet_version')}</Label2>
                            <Body3>{walletVersionText(wallet.active.version)}</Body3>
                        </SettingsListText>
                    </SettingsListItem>
                </LinkStyled>
                <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.jettons}>
                    <SettingsListItem>
                        <CoinsIcon />
                        <Label2>{t('settings_jettons_list')}</Label2>
                    </SettingsListItem>
                </LinkStyled>
            </SettingsListBlock>
            <DesktopViewDivider />
            <SettingsListBlock>
                <SettingsListItem onClick={onLogoutOpen}>
                    <ExitIcon />
                    <Label2>{t('preferences_aside_sign_out')}</Label2>
                </SettingsListItem>
            </SettingsListBlock>
            <DesktopViewDivider />

            <RenameWalletNotification
                wallet={isRenameOpen ? wallet : undefined}
                handleClose={onRenameClose}
            />
            <LogOutWalletNotification
                wallet={isLogoutOpen ? wallet : undefined}
                handleClose={onLogoutClose}
            />
        </DesktopViewPageLayout>
    );
};
