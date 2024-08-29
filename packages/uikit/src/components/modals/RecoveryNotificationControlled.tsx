import { Notification } from '../Notification';
import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { createModalControl } from './createModalControl';
import React, { useCallback } from 'react';
import { useAtom } from '../../libs/atom';
import { useAccountState } from '../../state/wallet';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { RecoveryContent } from '../../pages/settings/Recovery';
import styled from 'styled-components';

const { hook, paramsControl } = createModalControl<{
    accountId: AccountId;
    walletId?: WalletId;
}>();

export const useRecoveryNotification = hook;

const NotificationStyled = styled(Notification)`
    .dialog-header {
        padding-bottom: 0;
    }
`;

export const RecoveryNotificationControlled = () => {
    const { isOpen, onClose } = useRecoveryNotification();
    const [params] = useAtom(paramsControl);
    const account = useAccountState(params?.accountId);

    const Content = useCallback(() => {
        if (!account) {
            return null;
        }

        return <RecoveryContent accountId={account.id} walletId={params?.walletId} />;
    }, [account, params?.walletId]);

    return (
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {Content}
        </NotificationStyled>
    );
};
