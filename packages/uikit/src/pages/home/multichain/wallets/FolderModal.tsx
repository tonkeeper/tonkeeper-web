import { FC, useMemo, useState } from 'react';

import { Account } from '@tonkeeper/core/dist/entries/account';

import { Button, Checkbox, Input } from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { useTranslation } from '../../../../hooks/translation';
import { useAccountsState } from '../../../../state/wallet';
import { useDeleteFolder, useFolders, useUpdateFolder } from '../../../../state/folders';
import { AccountKindTag, accountShortAddress } from './accountDisplay';
import { WalletAvatar } from './WalletAvatar';

const AccountCheckRow: FC<{
    account: Account;
    checked: boolean;
    onToggle: () => void;
    divider: boolean;
}> = ({ account, checked, onToggle, divider }) => (
    <div className="bg-backgroundContent">
        {divider && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
        <button type="button" onClick={onToggle} className="flex w-full items-center text-left">
            <div className="shrink-0 py-4 pl-4">
                <WalletAvatar accountId={account.id} emoji={account.emoji} />
            </div>
            <div className="min-w-0 flex-1 p-4">
                <div className="flex items-center gap-1.5">
                    <span className="truncate text-label1 text-textPrimary">{account.name}</span>
                    <AccountKindTag type={account.type} />
                </div>
                <div className="truncate text-body2 text-textSecondary">
                    {accountShortAddress(account)}
                </div>
            </div>
            {/* Display-only: the whole row is the toggle, and the Checkbox's own
                click handler would bubble into the row's and cancel it out. */}
            <div className="shrink-0 py-4 pr-4">
                <Checkbox checked={checked} />
            </div>
        </button>
    </div>
);

/**
 * Create / edit a wallet folder: folder name, the ungrouped wallets (and,
 * when editing, this folder's own wallets) as a checkbox list, then the
 * wallets that sit in other folders under "Move from other Folders" —
 * saving pulls a checked wallet out of its previous folder. Deleting a
 * folder only ungroups its wallets.
 */
export const FolderModal: FC<{
    isOpen: boolean;
    onClose: () => void;
    folderId?: string;
}> = ({ isOpen, onClose, folderId }) => {
    const { t } = useTranslation();
    const folders = useFolders();
    const accounts = useAccountsState();
    const updateFolder = useUpdateFolder();
    const deleteFolder = useDeleteFolder();

    const folder = folders.find(f => f.id === folderId);

    const [name, setName] = useState(folder?.name ?? '');
    const [selected, setSelected] = useState<string[]>(
        folder ? folder.accounts.map(a => a.id) : []
    );
    const [isSaving, setIsSaving] = useState(false);

    const { freeAccounts, otherFolderAccounts } = useMemo(() => {
        const inOtherFolder = (account: Account) =>
            folders.some(f => f.id !== folderId && f.accounts.some(a => a.id === account.id));
        const visible = accounts.filter(a => a.type !== 'ton-multisig');
        return {
            freeAccounts: visible.filter(a => !inOtherFolder(a)),
            otherFolderAccounts: visible.filter(inOtherFolder)
        };
    }, [accounts, folders, folderId]);

    const toggle = (id: string) =>
        setSelected(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));

    const canSave = name.trim() !== '' && selected.length > 0;

    const onSave = async () => {
        if (!canSave) {
            return;
        }
        setIsSaving(true);
        try {
            await updateFolder({ id: folderId, name: name.trim(), accounts: selected });
        } finally {
            setIsSaving(false);
        }
        onClose();
    };

    const onDelete = async () => {
        if (!folderId) {
            return;
        }
        await deleteFolder({ id: folderId });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            variant="content"
            topBarTitle={t(folder ? 'accounts_manage_folder' : 'accounts_new_folder')}
        >
            <div className="flex flex-col gap-4 pb-4">
                <Input
                    id="folder-name"
                    value={name}
                    onChange={setName}
                    label={t('accounts_manage_folder_name')}
                />

                {freeAccounts.length > 0 && (
                    <div className="overflow-hidden rounded-medium">
                        {freeAccounts.map((account, i) => (
                            <AccountCheckRow
                                key={account.id}
                                account={account}
                                checked={selected.includes(account.id)}
                                onToggle={() => toggle(account.id)}
                                divider={i > 0}
                            />
                        ))}
                    </div>
                )}

                {otherFolderAccounts.length > 0 && (
                    <>
                        <div className="px-0.5 text-label1 text-textPrimary">
                            {t('accounts_manage_folder_move_from_other')}
                        </div>
                        <div className="overflow-hidden rounded-medium">
                            {otherFolderAccounts.map((account, i) => (
                                <AccountCheckRow
                                    key={account.id}
                                    account={account}
                                    checked={selected.includes(account.id)}
                                    onToggle={() => toggle(account.id)}
                                    divider={i > 0}
                                />
                            ))}
                        </div>
                    </>
                )}

                {folder && (
                    <Button variant="secondary" size="large" fullWidth onClick={onDelete}>
                        <span className="text-accentRed">{t('accounts_delete_folder')}</span>
                    </Button>
                )}
            </div>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant="primaryBlue"
                        size="large"
                        fullWidth
                        disabled={!canSave}
                        loading={isSaving}
                        onClick={onSave}
                    >
                        {t('add_edit_favorite_save')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
