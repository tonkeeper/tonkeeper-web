import { walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
    AppsIcon,
    CoinsIcon,
    ExitIcon,
    KeyIcon,
    SaleBadgeIcon,
    SwitchIcon
} from '../../components/Icon';
import { Body3, Label2 } from '../../components/Text';
import {
    DesktopViewDivider,
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { LogOutWalletNotification } from '../../components/settings/LogOutNotification';
import { RenameWalletNotification } from '../../components/settings/wallet-name/WalletNameNotification';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useDisclosure } from '../../hooks/useDisclosure';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';

const SettingsListBlock = styled.div`
    padding: 0.5rem 0;
`;

const SettingsListItem = styled.div`
    padding: 10px 1rem;
    display: flex;
    gap: 12px;
    align-items: center;

    transition: background-color 0.15s ease-in-out;
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
            <DesktopViewHeader borderBottom>
                <Label2>{t('settings_title')}</Label2>
            </DesktopViewHeader>
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
                <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.nft}>
                    <SettingsListItem>
                        <SaleBadgeIcon />
                        <Label2>NFT</Label2>
                    </SettingsListItem>
                </LinkStyled>
                <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.connectedApps}>
                    <SettingsListItem>
                        <AppsIcon />
                        <Label2>{t('settings_connected_apps')}</Label2>
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
