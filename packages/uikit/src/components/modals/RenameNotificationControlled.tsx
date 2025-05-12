import { Notification } from '../Notification';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { createModalControl } from './createModalControl';
import React, { useCallback } from 'react';
import { useTranslation } from '../../hooks/translation';
import { useAtom } from '../../libs/useAtom';
import { useAccountState } from '../../state/wallet';
import { RenameWalletContent } from '../settings/wallet-name/WalletNameNotification';

const { hook, paramsControl } = createModalControl<{
    accountId: AccountId;
    derivationIndex?: number;
}>();

export const useRenameNotification = hook;

export const RenameNotificationControlled = () => {
    const { isOpen, onClose } = useRenameNotification();
    const { t } = useTranslation();
    const [params] = useAtom(paramsControl);
    const account = useAccountState(params?.accountId);

    const Content = useCallback(() => {
        if (!account) {
            return null;
        }

        return (
            <RenameWalletContent
                account={account}
                derivationIndex={params?.derivationIndex}
                onClose={onClose}
            />
        );
    }, [onClose, params?.derivationIndex, account]);

    return (
        <Notification isOpen={isOpen} handleClose={onClose} title={t('Rename')} mobileFullScreen>
            {Content}
        </Notification>
    );
};
