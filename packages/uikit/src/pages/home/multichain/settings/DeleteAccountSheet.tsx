import { FC, useState } from 'react';
import { isPaidActiveSubscription } from '@tonkeeper/core/dist/entries/pro';

import { useTranslation } from '../../../../hooks/translation';
import { useProState } from '../../../../state/pro';
import { useMutateDeleteAll } from '../../../../state/wallet';
import { Button, Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives';
import IcTrashBin28 from '../../../../icons/components/IcTrashBin28';
import { BackupAcknowledgeRow } from './BackupAcknowledgeRow';
import { ProSubscriptionWarning } from './ProSubscriptionWarning';

/**
 * Confirmation gate for erasing every account and all personal data from
 * this device. Deletion clears the whole storage and reloads the app, so
 * the destructive action stays locked behind the "I have a backup"
 * acknowledgement.
 */
export const DeleteAccountSheet: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const { t } = useTranslation();
    const [checked, setChecked] = useState(false);
    // Clears all wallets and storage, then reloads the app itself — no
    // navigation after the mutation.
    const { mutate: deleteAll, isLoading } = useMutateDeleteAll();
    const { data: subscription } = useProState();

    return (
        <Modal isOpen={isOpen} onClose={onClose} afterClose={() => setChecked(false)}>
            <div className="flex flex-col items-center pb-6 text-center">
                <IcTrashBin28 className="size-[84px] text-accentRed" />
                <div className="px-8 pt-3 text-h2 text-textPrimary">{t('Delete_wallet_data')}</div>
                <div className="px-8 pt-1 text-body1 text-textSecondary">
                    {t('Delete_wallet_data_description')}
                </div>
            </div>
            {isPaidActiveSubscription(subscription) && (
                <ProSubscriptionWarning text={t('deleting_wallets_warning')} />
            )}
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
                        onClick={() => deleteAll()}
                    >
                        {t('Delete_wallet_data')}
                    </Button>
                    <Button variant="secondary" size="large" fullWidth onClick={onClose}>
                        {t('cancel')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
