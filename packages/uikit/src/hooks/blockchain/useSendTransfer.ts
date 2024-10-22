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
import { useTonAssetTransferService } from './useBlockchainService';
import { useNotifyErrorHandle } from '../useNotification';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';

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
    const getSender = useGetSender();
    const transferService = useTonAssetTransferService();

    return useMutation<boolean, Error>(async () => {
        try {
            if (isTonAsset(amount.asset)) {
                if (!('toAccount' in recipient)) {
                    throw new Error('Invalid recipient');
                }
                const comment = (recipient as TonRecipientData).comment;
                await transferService.send(
                    await getSender({ type: senderType }),
                    estimation as TransferEstimation<TonAsset>,
                    {
                        to: seeIfValidTonAddress(recipient.address.address)
                            ? recipient.address.address
                            : recipient.toAccount.address,
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
