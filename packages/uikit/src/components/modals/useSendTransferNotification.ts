import { useAppSdk } from '../../hooks/appSdk';
import { useCallback } from 'react';
import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';

export const useSendTransferNotification = () => {
    const sdk = useAppSdk();

    const onOpen = useCallback(
        (params?: TransferInitParams) => {
            sdk.uiEvents.emit('transfer', {
                method: 'transfer',
                id: Date.now(),
                params: {
                    ...params,
                    from: 'wallet'
                }
            });
        },
        [sdk]
    );

    return { onOpen };
};
