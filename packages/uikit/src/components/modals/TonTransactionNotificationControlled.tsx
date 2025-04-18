import { createModalControl } from './createModalControl';
import React, { useCallback } from 'react';
import { useAtom } from '../../libs/useAtom';
import { TonTransactionNotification } from '../connect/TonTransactionNotification';
import { TonConnectTransactionPayload } from '@tonkeeper/core/dist/entries/tonConnect';

const { hook, paramsControl } = createModalControl<{
    params: TonConnectTransactionPayload | null;
    afterClose?: (result?: string) => void;
    waitInvalidation?: boolean;
}>();

export const useTonTransactionNotification = hook;

export const TonTransactionNotificationControlled = () => {
    const { isOpen, onClose } = useTonTransactionNotification();
    const [_params] = useAtom(paramsControl);
    const params = isOpen ? _params : null;

    const handleClose = useCallback(
        (res?: string) => {
            onClose();
            params?.afterClose?.(res);
        },
        [onClose, params?.afterClose]
    );

    return (
        <TonTransactionNotification
            params={params?.params ?? null}
            waitInvalidation={params?.waitInvalidation}
            handleClose={handleClose}
        />
    );
};
