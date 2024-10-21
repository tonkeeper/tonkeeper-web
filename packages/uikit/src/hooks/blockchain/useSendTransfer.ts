import { useMutation } from '@tanstack/react-query';
import { isTonAsset, Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { isTon, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    TonRecipientData,
    TransferEstimation,
    TronRecipientData
} from '@tonkeeper/core/dist/entries/send';
import { useAnalyticsTrack } from '../amplitude';
import { useInvalidateActiveWalletQueries } from '../../state/wallet';

import { SenderType, useGetSender } from './useSender';
import { useTransferService } from './useTransferService';
import { useNotifyErrorHandle } from '../useNotification';

export function useSendTransfer<T extends Asset>({
    recipient,
    amount,
    isMax,
    estimation,
    senderType
}: {
    recipient: T extends TonAsset ? TonRecipientData : TronRecipientData;
    amount: AssetAmount<T>;
    isMax: boolean;
    estimation: TransferEstimation<T>;
    senderType: SenderType;
}) {
    const track = useAnalyticsTrack();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();
    const notifyError = useNotifyErrorHandle();
    const getSender = useGetSender(senderType);
    const transferService = useTransferService();

    return useMutation<boolean, Error>(async () => {
        try {
            if (isTonAsset(amount.asset)) {
                const comment = (recipient as TonRecipientData).comment;
                await transferService.send(
                    await getSender(),
                    estimation as TransferEstimation<TonAsset>,
                    {
                        to: (recipient as TonRecipientData).toAccount.address,
                        amount: amount as AssetAmount<TonAsset>,
                        isMax,
                        payload: comment ? { type: 'comment', value: comment } : undefined
                    }
                );
                track('send_success', {
                    from: 'send_confirm',
                    token: isTon(amount.asset.address) ? 'ton' : amount.asset.symbol
                });
            } else {
                throw new Error('Disable trc 20 transactions');
            }
        } catch (e) {
            await notifyError(e);
        }

        await invalidateAccountQueries();
        return true;
    });
}
