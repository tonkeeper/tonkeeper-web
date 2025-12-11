import { useAppSdk } from '../../hooks/appSdk';
import { useCallback } from 'react';
import { TransferInitParams } from '@tonkeeper/core/dist/AppSdk';
import { useTrc20TransfersNumberAvailable } from '../../state/tron/tron';
import { useTopUpTronFeeBalanceNotification } from './TopUpTronFeeBalanceNotificationControlled';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';

export const useSendTransferNotification = () => {
    const sdk = useAppSdk();
    const availableTrc20Transfers = useTrc20TransfersNumberAvailable();
    const { onOpen: openTopUpNotification } = useTopUpTronFeeBalanceNotification();

    const onOpen = useCallback(
        (params?: Omit<TransferInitParams, 'from'>) => {
            if (params?.chain === BLOCKCHAIN_NAME.TRON && availableTrc20Transfers.total === 0) {
                return openTopUpNotification();
            }
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
