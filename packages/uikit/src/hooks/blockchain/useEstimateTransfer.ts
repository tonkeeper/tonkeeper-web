import { useQuery } from '@tanstack/react-query';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    RecipientData,
    TonRecipientData,
    TransferEstimation
} from '@tonkeeper/core/dist/entries/send';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval } from '../../state/tonendpoint';
import { SenderType, useEstimationSender } from './useSender';
import { useTransferService } from './useTransferService';
import { useNotifyErrorHandle } from '../useNotification';

export function useEstimateTransfer({
    recipient,
    amount,
    isMax,
    senderType
}: {
    recipient: RecipientData;
    amount: AssetAmount<Asset>;
    isMax: boolean;
    senderType: SenderType;
}) {
    const sender = useEstimationSender(senderType);
    const transferService = useTransferService();
    const notifyError = useNotifyErrorHandle();

    return useQuery<TransferEstimation<Asset>, Error>(
        [QueryKey.estimate, recipient, amount, isMax, sender, transferService, notifyError],
        async () => {
            const comment = (recipient as TonRecipientData).comment;
            try {
                if (isTonAsset(amount.asset)) {
                    return await transferService.estimate(sender!, {
                        to: (recipient as TonRecipientData).toAccount.address,
                        amount: amount as AssetAmount<TonAsset>,
                        isMax,
                        payload: comment ? { type: 'comment', value: comment } : undefined
                    });
                } else {
                    throw new Error('Tron is not supported');
                }
            } catch (e) {
                await notifyError(e);
                throw e;
            }
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchOnMount: 'always',
            enabled: !!sender
        }
    );
}
