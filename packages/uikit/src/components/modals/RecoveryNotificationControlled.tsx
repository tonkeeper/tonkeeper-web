import { AccountId } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useCallback } from 'react';
import styled from 'styled-components';
import { useAtom } from '../../libs/atom';
import { RecoveryContent } from '../../pages/settings/Recovery';
import { useAccountState } from '../../state/wallet';
import { Notification } from '../Notification';
import { createModalControl } from './createModalControl';

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

        return (
            <RecoveryContent
                accountId={account.id}
                walletId={params?.walletId}
                isPage={false}
                onClose={onClose}
            />
        );
    }, [account, params?.walletId, onClose]);

    return (
        <NotificationStyled isOpen={isOpen} handleClose={onClose}>
            {Content}
        </NotificationStyled>
    );
};
