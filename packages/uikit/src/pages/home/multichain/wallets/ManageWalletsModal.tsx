import { FC, useState } from 'react';

import { useAddWalletFlow } from '../../../../components/modals/AddWalletFlow';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import IcFolder16 from '../../../../icons/components/IcFolder16';
import IcPlus16 from '../../../../icons/components/IcPlus16';
import { MultichainRoute, MultichainSettingsRoute } from '../../../../libs/routes';
import { Button } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';
import { SETTINGS_ACCOUNT_ID_PARAM } from '../settings/useSettingsAccount';
import { FolderModal } from './FolderModal';
import { ManageWalletsList, useManageWalletsItems } from './ManageWalletsList';

/**
 * Manage-wallets modal reached from the desktop sidebar: folders and loose
 * wallets in one list. Folders collapse/expand, reorder at the top level,
 * and wallets reorder inside their folder. Row rendering and drag-and-drop
 * live in ManageWalletsList; this component owns modal navigation and its
 * secondary actions.
 */
export const ManageWalletsModal: FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { onOpen: openAddWallet } = useAddWalletFlow();

    const items = useManageWalletsItems();
    // '' opens the editor in create mode; a folder id opens it prefilled.
    const [folderEditor, setFolderEditor] = useState<string | undefined>(undefined);

    const onEditAccount = (id: string) => {
        onClose();
        navigate(
            `${MultichainRoute.settings}${
                MultichainSettingsRoute.customize
            }?${SETTINGS_ACCOUNT_ID_PARAM}=${encodeURIComponent(id)}`
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            variant="content"
            topBarTitle={t('Manage_wallets')}
        >
            <div className="flex flex-col pb-4">
                <div className="overflow-hidden rounded-medium">
                    <ManageWalletsList
                        items={items}
                        onEditAccount={onEditAccount}
                        onEditFolder={setFolderEditor}
                    />
                </div>

                <div className="flex justify-center gap-3 pt-4">
                    <Button
                        variant="secondary"
                        size="small"
                        leftIcon={<IcPlus16 className="size-4" />}
                        onClick={() => {
                            onClose();
                            openAddWallet();
                        }}
                    >
                        {t('aside_add_wallet')}
                    </Button>
                    <Button
                        variant="secondary"
                        size="small"
                        leftIcon={<IcFolder16 className="size-4" />}
                        onClick={() => setFolderEditor('')}
                    >
                        {t('accounts_new_folder')}
                    </Button>
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
