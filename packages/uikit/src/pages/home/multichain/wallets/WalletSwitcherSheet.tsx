import { FC, useState } from 'react';

import { Account } from '@tonkeeper/core/dist/entries/account';

import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { AppRoute, MultichainRoute, MultichainSettingsRoute } from '../../../../libs/routes';
import { useActiveAccount, useMutateActiveAccount } from '../../../../state/wallet';
import { useAccountsOrdered } from '../../../../state/folders';
import { useAddWalletFlow } from '../../../../components/modals/AddWalletFlow';
import { Button, Modal } from '../../../../primitives';
import IcDonemarkOutline28 from '../../../../icons/components/IcDonemarkOutline28';
import { SETTINGS_ACCOUNT_ID_PARAM } from '../settings/useSettingsAccount';
import { FolderModal } from './FolderModal';
import { ManageWalletsList, useManageWalletsItems } from './ManageWalletsList';
import { WalletRow } from './WalletRow';

/**
 * Wallets sheet for the multichain shell — the multichain and legacy
 * accounts a user owns live in one list, so this is also the only way a
 * multichain user reaches a legacy wallet (and the "Add Wallet" entry
 * point that creates one).
 *
 * Two states behind one top-bar button. Picking a wallet switches to it;
 * `Edit` swaps the list in place for the manage view — folders,
 * reordering and a per-row edit affordance — and turns the button into
 * `Done`. Multisigs are left out of both: they're hosted by a legacy
 * account and have no standalone home, matching the legacy mobile
 * switcher. A MAM account keeps whatever derivation was last active;
 * per-derivation rows stay in the legacy manage-wallets screens.
 */
export const WalletSwitcherSheet: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const accounts = useAccountsOrdered();
    const manageItems = useManageWalletsItems();
    const activeAccount = useActiveAccount();
    const { mutateAsync: setActiveAccount } = useMutateActiveAccount();
    const { onOpen: openAddWallet } = useAddWalletFlow();
    const [editing, setEditing] = useState(false);
    // '' opens the editor in create mode; a folder id opens it prefilled.
    const [folderEditor, setFolderEditor] = useState<string | undefined>(undefined);

    const close = () => {
        setEditing(false);
        onClose();
    };

    const switchTo = async (account: Account) => {
        close();
        if (account.id === activeAccount.id) {
            return;
        }
        await setActiveAccount(account.id);
        // Both shells render their home on the catch-all route, so one
        // target works for a legacy and a multichain account alike.
        navigate(AppRoute.home);
    };

    const editAccount = (id: string) => {
        close();
        navigate(
            `${MultichainRoute.settings}${
                MultichainSettingsRoute.customize
            }?${SETTINGS_ACCOUNT_ID_PARAM}=${encodeURIComponent(id)}`
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={close}
            variant="content"
            topBarTitle={t('wallets')}
            topBarLeft={
                <Button
                    variant="secondary"
                    size="small"
                    // The header pill is 32px tall; `!` is needed because Tailwind
                    // emits `h-9` after `h-8`, so the size class would win.
                    className="!h-8 !px-3"
                    onClick={() => setEditing(value => !value)}
                >
                    {editing
                        ? t('wallet_aside_menu_tabs_edit_btn_done')
                        : t('wallet_aside_menu_tabs_edit_btn_edit')}
                </Button>
            }
        >
            <div className="flex flex-col pb-4">
                {editing ? (
                    <div className="overflow-hidden rounded-medium">
                        <ManageWalletsList
                            items={manageItems}
                            onEditAccount={editAccount}
                            onEditFolder={setFolderEditor}
                        />
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-medium">
                        {accounts
                            .filter(account => account.type !== 'ton-multisig')
                            .map((account, index) => (
                                <WalletRow
                                    key={account.id}
                                    account={account}
                                    divider={index > 0}
                                    accessory={
                                        account.id === activeAccount.id && (
                                            <div className="flex shrink-0 items-center py-3.5 pr-4 text-accentBlue">
                                                <IcDonemarkOutline28 className="size-7" />
                                            </div>
                                        )
                                    }
                                    onClick={() => switchTo(account)}
                                />
                            ))}
                    </div>
                )}

                <div className="flex justify-center gap-3 pt-4">
                    <Button
                        variant="secondary"
                        size="small"
                        onClick={() => {
                            close();
                            openAddWallet();
                        }}
                    >
                        {t('aside_add_wallet')}
                    </Button>
                    {editing && (
                        <Button
                            variant="secondary"
                            size="small"
                            onClick={() => setFolderEditor('')}
                        >
                            {t('accounts_new_folder')}
                        </Button>
                    )}
                </div>
            </div>

            {folderEditor !== undefined && (
                <FolderModal
                    isOpen
                    folderId={folderEditor || undefined}
                    onClose={() => setFolderEditor(undefined)}
                />
            )}
        </Modal>
    );
};
