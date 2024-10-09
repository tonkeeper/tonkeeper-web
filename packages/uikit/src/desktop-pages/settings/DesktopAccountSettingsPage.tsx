import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { ExitIcon, KeyIcon, SwitchIcon } from '../../components/Icon';
import { Body3, Label2 } from '../../components/Text';
import {
    DesktopViewDivider,
    DesktopViewHeader,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useTranslation } from '../../hooks/translation';
import { useActiveAccount } from '../../state/wallet';
import { AccountMAM } from '@tonkeeper/core/dist/entries/account';
import { useRenameNotification } from '../../components/modals/RenameNotificationControlled';
import { useRecoveryNotification } from '../../components/modals/RecoveryNotificationControlled';
import React, { FC } from 'react';
import { useDeleteAccountNotification } from '../../components/modals/DeleteAccountNotificationControlled';
import { useMAMIndexesSettingsNotification } from '../../components/modals/MAMIndexesSettingsNotification';
import { DesktopAccountHeader } from '../../components/desktop/header/DesktopAccountHeader';

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

    > svg {
        color: ${p => p.theme.iconSecondary};
        flex-shrink: 0;
    }
`;

const SettingsListText = styled.div`
    display: flex;
    flex-direction: column;
    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const DesktopAccountSettingsPage: FC = () => {
    const account = useActiveAccount();

    if (account.type !== 'mam') {
        return <Navigate to="../" />;
    }

    return <DesktopAccountSettingsPageContent account={account} />;
};

export default DesktopAccountSettingsPage;

const DesktopAccountSettingsPageContent: FC<{ account: AccountMAM }> = ({ account }) => {
    const { t } = useTranslation();
    const { onOpen: rename } = useRenameNotification();
    const { onOpen: recovery } = useRecoveryNotification();
    const { onOpen: changeIndexes } = useMAMIndexesSettingsNotification();
    const { onOpen: onDelete } = useDeleteAccountNotification();

    return (
        <>
            <DesktopAccountHeader />
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
                </SettingsListBlock>
                <DesktopViewDivider />
                <SettingsListBlock>
                    <SettingsListItem onClick={() => recovery({ accountId: account.id })}>
                        <KeyIcon />
                        <SettingsListText>
                            <Label2>{t('settings_backup_account')}</Label2>
                            <Body3>{t('settings_backup_account_mam_description')}</Body3>
                        </SettingsListText>
                    </SettingsListItem>
                    <SettingsListItem onClick={() => changeIndexes({ accountId: account.id })}>
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
                </SettingsListBlock>
                <DesktopViewDivider />
                <SettingsListBlock>
                    <SettingsListItem onClick={() => onDelete({ accountId: account.id })}>
                        <ExitIcon />
                        <Label2>{t('settings_delete_account')}</Label2>
                    </SettingsListItem>
                </SettingsListBlock>
                <DesktopViewDivider />
            </DesktopViewPageLayout>
        </>
    );
};