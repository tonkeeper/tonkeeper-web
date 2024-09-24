import { Notification } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useAtom } from '../../libs/atom';
import { AccountsFolder, useGlobalPreferences } from '../../state/global-preferences';
import { useAccountsState } from '../../state/wallet';
import { ListBlockDesktopAdaptive, ListItem, ListItemPayload } from '../List';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import styled from 'styled-components';
import { Label2, TextEllipsis } from '../Text';
import { AccountBadge } from '../account/AccountBadge';
import { Checkbox } from '../fields/Checkbox';
import { AccountId } from '@tonkeeper/core/dist/entries/account';

const { hook, paramsControl } = createModalControl<{
    folderId?: string;
}>();

export const useManageFolderNotification = hook;

export const ManageFolderNotificationControlled = () => {
    const { isOpen, onClose } = useManageFolderNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);
    const { folders } = useGlobalPreferences();

    const Content = useCallback(() => {
        const folder = folders.find(f => f.id === params?.folderId);
        return <ModalContent folder={folder} onClose={onClose} />;
    }, [onClose, params?.folderId, folders]);

    return (
        <Notification isOpen={isOpen} handleClose={onClose} title={t('accounts_new_folder')}>
            {Content}
        </Notification>
    );
};

const Label2Styled = styled(Label2)`
    ${TextEllipsis}
`;

const ListBlockDesktopAdaptiveStyled = styled(ListBlockDesktopAdaptive)`
    margin: 0 -1rem;
    background: transparent;
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    justify-content: flex-start;
`;

const CheckboxStyled = styled(Checkbox)`
    margin-left: auto;
`;

const ModalContent: FC<{ folder?: AccountsFolder; onClose: () => void }> = ({
    folder,
    onClose
}) => {
    const [checkedAccounts, setChecked] = useState(folder?.accounts || []);
    const accounts = useAccountsState();
    const { folders } = useGlobalPreferences();

    const { availableAccounts, unAvailableAccounts } = useMemo(() => {
        const _availableAccounts = accounts.filter(acc =>
            folders.every(f => f.id !== folder?.id || !f.accounts.includes(acc.id))
        );
        return {
            availableAccounts: _availableAccounts,
            unAvailableAccounts: accounts.filter(acc => !_availableAccounts.includes(acc))
        };
    }, [accounts, folders]);

    const toggleCheckbox = (accId: AccountId) => {
        if (checkedAccounts.includes(accId)) {
            setChecked(prev => prev.filter(id => id !== accId));
        } else {
            setChecked(prev => [...prev, accId]);
        }
    };

    return (
        <ListBlockDesktopAdaptiveStyled>
            {availableAccounts.map(acc => (
                <ListItem key={acc.id} hover={false}>
                    <ListItemPayloadStyled>
                        <WalletEmoji emojiSize="16px" containerSize="16px" emoji={acc.emoji} />
                        <Label2Styled>{acc.name}</Label2Styled>
                        <AccountBadge accountType={acc.type} size="s" />
                        <CheckboxStyled
                            checked={checkedAccounts.includes(acc.id)}
                            onChange={() => toggleCheckbox(acc.id)}
                        />
                    </ListItemPayloadStyled>
                </ListItem>
            ))}
        </ListBlockDesktopAdaptiveStyled>
    );
};
