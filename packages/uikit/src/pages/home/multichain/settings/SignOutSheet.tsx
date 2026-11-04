import { FC, useState } from 'react';

import { useDeleteActiveWalletWarning } from '../../../../hooks/pro/useDeleteActiveWalletWarning';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useTranslation } from '../../../../hooks/translation';
import { useToastMutationError } from '../../../../hooks/useNotification';
import { MultichainRoute } from '../../../../libs/routes';
import { useActiveAccount, useMutateLogOut } from '../../../../state/wallet';
import { Button, Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives';
import IcDoor28 from '../../../../icons/components/IcDoor28';
import { WalletEmoji } from '../../../../components/shared/emoji/WalletEmoji';
import { BackupAcknowledgeRow } from './BackupAcknowledgeRow';
import { ProSubscriptionWarning } from './ProSubscriptionWarning';

/**
 * Confirmation gate for signing the active account out. Signing out erases
 * the account's keys from this device, so the destructive action stays
 * locked behind the "I have a backup" acknowledgement.
 */
export const SignOutSheet: FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const account = useActiveAccount();
    const [checked, setChecked] = useState(false);
    const { mutateAsync: signOut, isLoading } = useMutateLogOut();
    const toastError = useToastMutationError();
    // Only warns when the wallet being signed out is the one holding Pro.
    const { isWarningVisible } = useDeleteActiveWalletWarning();

    const onConfirm = async () => {
        try {
            await signOut(account.id);
        } catch (e) {
            // Nothing changed either way, so the sheet stays open. A dismissed
            // security prompt is silent; an actual failure gets the toast.
            toastError(e);
            return;
        }
        onClose();
        navigate(MultichainRoute.home);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} afterClose={() => setChecked(false)}>
            <div className="flex flex-col items-center pb-6 text-center">
                <IcDoor28 className="size-[84px] text-accentRed" />
                <div className="px-8 pt-3 text-h2 text-textPrimary">
                    {t('settings_reset_alert_title')}
                </div>
                <div className="flex items-center gap-1 pt-1 text-body1 text-textSecondary">
                    <WalletEmoji emoji={account.emoji} emojiSize="16px" containerSize="16px" />
                    {account.name}
                </div>
                <div className="px-8 pt-1 text-body1 text-textSecondary">
                    {t('logout_on_unlock_one')}
                </div>
            </div>
            {isWarningVisible && <ProSubscriptionWarning text={t('deleting_wallet_warning')} />}
            <BackupAcknowledgeRow
                checked={checked}
                onChange={setChecked}
                onLeaveForBackup={onClose}
            />
            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant="destructive"
                        size="large"
                        fullWidth
                        disabled={!checked}
                        loading={isLoading}
                        onClick={onConfirm}
                    >
                        {t('settings_reset')}
                    </Button>
                    <Button variant="secondary" size="large" fullWidth onClick={onClose}>
                        {t('cancel')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
