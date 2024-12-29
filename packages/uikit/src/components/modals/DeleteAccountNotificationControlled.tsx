import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { createModalControl } from './createModalControl';
import React, { useCallback } from 'react';
import { useAtom } from '../../libs/atom';
import { useAccountState } from '../../state/wallet';
import { Notification } from '../Notification';
import { DeleteNotificationContent } from '../settings/DeleteAccountNotification';

const { hook, paramsControl } = createModalControl<{
    accountId: AccountId;
}>();

export const useDeleteAccountNotification = hook;

export const DeleteAccountNotificationControlled = () => {
    const { isOpen, onClose } = useDeleteAccountNotification();
    const [params] = useAtom(paramsControl);
    const account = useAccountState(params?.accountId);

    const Content = useCallback(
        (afterClose: () => void) => {
            if (!account) return undefined;
            return (
                <DeleteNotificationContent
                    accountId={account.id}
                    onClose={afterClose}
                    isKeystone={account.type === 'keystone'}
                    isReadOnly={account.type === 'watch-only'}
                />
            );
        },
        [account]
    );

    return (
        <Notification isOpen={isOpen} handleClose={onClose}>
            {Content}
        </Notification>
    );
};
