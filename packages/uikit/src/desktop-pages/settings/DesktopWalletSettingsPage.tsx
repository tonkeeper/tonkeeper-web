import { TonWalletStandard, walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
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
import { DeleteAccountNotification } from '../../components/settings/DeleteAccountNotification';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useTranslation } from '../../hooks/translation';
import { useDisclosure } from '../../hooks/useDisclosure';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';
import { useActiveAccount, useIsActiveWalletWatchOnly } from '../../state/wallet';
import { isAccountVersionEditable } from '@tonkeeper/core/dist/entries/account';
import { useRenameNotification } from '../../components/modals/RenameNotification';

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
    const account = useActiveAccount();
    const { onOpen: rename } = useRenameNotification();
    const { isOpen: isDeleteOpen, onClose: onDeleteClose, onOpen: onDeleteOpen } = useDisclosure();

    const isReadOnly = useIsActiveWalletWatchOnly();

    const canChangeVersion = isAccountVersionEditable(account);
    const canChangeDerivations = account.type === 'mam';

    // check available derivations length to filter and keep only non-legacy added ledger accounts
    const canChangeLedgerIndex =
        account.type === 'ledger' && account.allAvailableDerivations.length > 1;
    const activeWallet = account.activeTonWallet;

    const activeDerivation = account.type === 'mam' ? account.activeDerivation : undefined;

    return (
        <DesktopViewPageLayout>
            <DesktopViewHeader borderBottom>
                <Label2>{t('settings_title')}</Label2>
            </DesktopViewHeader>
            <SettingsListBlock>
                <SettingsListItem onClick={() => rename({ accountId: account.id })}>
                    <WalletEmoji containerSize="16px" emojiSize="16px" emoji={account.emoji} />
                    <SettingsListText>
                        <Label2>{account.name || t('wallet_title')}</Label2>
                        <Body3>{t('customize')}</Body3>
                    </SettingsListText>
                </SettingsListItem>
                {activeDerivation && (
                    <SettingsListItem
                        onClick={() =>
                            rename({
                                accountId: account.id,
                                derivationIndex: activeDerivation.index
                            })
                        }
                    >
                        <WalletEmoji
                            containerSize="16px"
                            emojiSize="16px"
                            emoji={activeDerivation.emoji}
                        />
                        <SettingsListText>
                            <Label2>{activeDerivation.name}</Label2>
                            <Body3>{t('customize')}</Body3>
                        </SettingsListText>
                    </SettingsListItem>
                )}
            </SettingsListBlock>
            <DesktopViewDivider />
            <SettingsListBlock>
                {account.type === 'mnemonic' && (
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.recovery}>
                        <SettingsListItem>
                            <KeyIcon />
                            <Label2>{t('settings_backup_seed')}</Label2>
                        </SettingsListItem>
                    </LinkStyled>
                )}
                {canChangeVersion && (
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.version}>
                        <SettingsListItem>
                            <SwitchIcon />
                            <SettingsListText>
                                <Label2>{t('settings_wallet_version')}</Label2>
                                <Body3>
                                    {walletVersionText((activeWallet as TonWalletStandard).version)}
                                </Body3>
                            </SettingsListText>
                        </SettingsListItem>
                    </LinkStyled>
                )}
                {canChangeLedgerIndex && (
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.ledgerIndexes}>
                        <SettingsListItem>
                            <SwitchIcon />
                            <SettingsListText>
                                <Label2>{t('settings_ledger_indexes')}</Label2>
                                <Body3># {account.activeDerivationIndex + 1}</Body3>
                            </SettingsListText>
                        </SettingsListItem>
                    </LinkStyled>
                )}
                {canChangeDerivations && (
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.derivations}>
                        <SettingsListItem>
                            <SwitchIcon />
                            <SettingsListText>
                                <Label2>{t('settings_mam_indexes')}</Label2>
                                <Body3>
                                    {t('settings_mam_number_wallets').replace(
                                        '%{number}',
                                        account.derivations.length.toString()
                                    )}
                                </Body3>
                            </SettingsListText>
                        </SettingsListItem>
                    </LinkStyled>
                )}
                <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.jettons}>
                    <SettingsListItem>
                        <CoinsIcon />
                        <Label2>{t('settings_jettons_list')}</Label2>
                    </SettingsListItem>
                </LinkStyled>
                <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.nft}>
                    <SettingsListItem>
                        <SaleBadgeIcon />
                        <Label2>{t('settings_collectibles_list')}</Label2>
                    </SettingsListItem>
                </LinkStyled>
                {!isReadOnly && (
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.connectedApps}>
                        <SettingsListItem>
                            <AppsIcon />
                            <Label2>{t('settings_connected_apps')}</Label2>
                        </SettingsListItem>
                    </LinkStyled>
                )}
            </SettingsListBlock>
            <DesktopViewDivider />
            <SettingsListBlock>
                <SettingsListItem onClick={onDeleteOpen}>
                    <ExitIcon />
                    <Label2>{t('Delete_wallet_data')}</Label2>
                </SettingsListItem>
            </SettingsListBlock>
            <DesktopViewDivider />
            <DeleteAccountNotification
                account={isDeleteOpen ? account : undefined}
                handleClose={onDeleteClose}
            />
        </DesktopViewPageLayout>
    );
};
