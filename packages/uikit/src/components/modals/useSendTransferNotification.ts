import { useAppSdk } from '../../hooks/appSdk';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useCallback } from 'react';
import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';

export const useSendTransferNotification = () => {
    const sdk = useAppSdk();

    const onOpen = useCallback(
        (params?: TransferInitParams) => {
            sdk.uiEvents.emit('transfer', {
                method: 'transfer',
                id: Date.now(),
                params: { asset: 'TON', chain: BLOCKCHAIN_NAME.TON, ...params }
            });
        },
        [sdk]
    );

    return { onOpen };
};
