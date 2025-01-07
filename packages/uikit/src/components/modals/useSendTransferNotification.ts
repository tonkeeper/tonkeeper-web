import { useAppSdk } from '../../hooks/appSdk';
import { useCallback } from 'react';
import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';

export const useSendTransferNotification = () => {
    const sdk = useAppSdk();

    const onOpen = useCallback(
        (params?: Omit<TransferInitParams, 'from'>) => {
            sdk.uiEvents.emit('transfer', {
                method: 'transfer',
                id: Date.now(),
                params: {
                    ...params,
                    from: 'wallet' as const
                } as TransferInitParams
            });
        },
        [sdk]
    );

    return { onOpen };
};
