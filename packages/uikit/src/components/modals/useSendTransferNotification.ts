import { useAppSdk } from '../../hooks/appSdk';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useCallback } from 'react';
import { TonTransferParams } from '@tonkeeper/core/dist/service/deeplinkingService';

export const useSendTransferNotification = () => {
    const sdk = useAppSdk();

    const onOpen = useCallback(
        (params?: TonTransferParams) => {
            sdk.uiEvents.emit('transfer', {
                method: 'transfer',
                id: Date.now(),
                params: { chain: BLOCKCHAIN_NAME.TON, ...params }
            });
        },
        [sdk]
    );

    return { onOpen };
};
