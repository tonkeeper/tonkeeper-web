import { Notification, NotificationFooterPortal } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { FC, useCallback, useMemo, useState } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useAtom } from '../../libs/atom';
import { useGlobalPreferences } from '../../state/global-preferences';
import { useAccountsState } from '../../state/wallet';
import { ListBlockDesktopAdaptive, ListItem, ListItemPayload } from '../List';
import { WalletEmoji } from '../shared/emoji/WalletEmoji';
import styled from 'styled-components';
import { Body3, Label2, NoSelectText, TextEllipsis } from '../Text';
import { AccountBadge } from '../account/AccountBadge';
import { Checkbox } from '../fields/Checkbox';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { Button } from '../fields/Button';
import { Input } from '../fields/Input';
import {
    AccountsFolder,
    useDeleteFolder,
    useFolders,
    useNewFolderName,
    useUpdateFolder
} from '../../state/folders';

const { hook, paramsControl } = createModalControl<{
    folderId?: string;
}>();

export const useManageFolderNotification = hook;

export const ManageFolderNotificationControlled = () => {
    const { isOpen, onClose } = useManageFolderNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);
    const folders = useFolders();

    const Content = useCallback(() => {
        const folder = folders.find(f => f.id === params?.folderId);
        return <ModalContent folder={folder} onClose={onClose} />;
    }, [onClose, params?.folderId, folders]);

    return (
        <Notification
            isOpen={isOpen}
            handleClose={onClose}
            title={t(
                params?.folderId !== undefined ? 'accounts_manage_folder' : 'accounts_new_folder'
            )}
        >
            {Content}
        </Notification>
    );
};

const ModalContentWrapper = styled.div``;

const Label2Styled = styled(Label2)`
    ${TextEllipsis}
`;

const ListBlockDesktopAdaptiveStyled = styled(ListBlockDesktopAdaptive)`
    margin: 0 -1rem;
    background: transparent;
`;

const ListItemPayloadStyled = styled(ListItemPayload)`
    justify-content: flex-start;

    * {
        ${NoSelectText};
    }
`;

const CheckboxStyled = styled(Checkbox)`
    margin-left: auto;
`;

const Body3Secondary = styled(Body3)`
    color: ${props => props.theme.textSecondary};
`;

const ButtonsContainer = styled.div`
    display: flex;
    gap: 0.5rem;
    padding: 1rem 0;

    > * {
        flex: 1;
    }
`;

const InputStyled = styled(Input)`
    margin-bottom: 1rem;
`;

const ModalContent: FC<{ folder?: AccountsFolder; onClose: () => void }> = ({
    folder,
    onClose
}) => {
    const { t } = useTranslation();
    const accounts = useAccountsState().filter(a => a.type !== 'ton-multisig');
    const { folders } = useGlobalPreferences();
    const newFolderName = useNewFolderName();
    const { mutateAsync: updateFolder } = useUpdateFolder();
    const { mutateAsync: deleteFolder } = useDeleteFolder();

    const [checkedAccounts, setChecked] = useState(folder?.accounts.map(a => a.id) || []);
    const [folderName, setFolderName] = useState(folder?.name || newFolderName);

    const { availableAccounts, unAvailableAccounts } = useMemo(() => {
        const _availableAccounts = accounts.filter(acc =>
            folders.every(f => f.id === folder?.id || !f.accounts.includes(acc.id))
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

    const isValidInput = folderName.length > 0;
    const folderNameDiffers = folderName !== folder?.name;
    const accountsDiffers =
        JSON.stringify(checkedAccounts) !== JSON.stringify(folder?.accounts || []);
    const canSave = (isValidInput && folderNameDiffers) || accountsDiffers;

    const onSave = async () => {
        if (!checkedAccounts.length && folder?.id !== undefined) {
            await deleteFolder({ id: folder.id });
            onClose();
        }

        if (checkedAccounts.length) {
            await updateFolder({ id: folder?.id, name: folderName, accounts: checkedAccounts });
            onClose();
        }
    };

    return (
        <ModalContentWrapper>
            <InputStyled
                value={folderName}
                onChange={setFolderName}
                label={t('accounts_manage_folder_name')}
                isValid={isValidInput}
                clearButton
            />
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
                {!!unAvailableAccounts.length && (
                    <>
                        <ListItem hover={false}>
                            <ListItemPayloadStyled>
                                <Body3Secondary>
                                    {t('accounts_manage_folder_move_from_other')}
                                </Body3Secondary>
                            </ListItemPayloadStyled>
                        </ListItem>
                        {unAvailableAccounts.map(acc => (
                            <ListItem key={acc.id} hover={false}>
                                <ListItemPayloadStyled>
                                    <WalletEmoji
                                        emojiSize="16px"
                                        containerSize="16px"
                                        emoji={acc.emoji}
                                    />
                                    <Label2Styled>{acc.name}</Label2Styled>
                                    <AccountBadge accountType={acc.type} size="s" />
                                    <CheckboxStyled
                                        checked={checkedAccounts.includes(acc.id)}
                                        onChange={() => toggleCheckbox(acc.id)}
                                    />
                                </ListItemPayloadStyled>
                            </ListItem>
                        ))}
                    </>
                )}
            </ListBlockDesktopAdaptiveStyled>
            <NotificationFooterPortal>
                <ButtonsContainer>
                    <Button secondary onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button primary disabled={!canSave} onClick={onSave}>
                        {t('save')}
                    </Button>
                </ButtonsContainer>
            </NotificationFooterPortal>
        </ModalContentWrapper>
    );
};
