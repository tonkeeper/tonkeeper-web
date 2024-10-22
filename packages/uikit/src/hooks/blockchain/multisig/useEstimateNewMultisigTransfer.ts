import { useMutation } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonRecipientData, TransferEstimation } from '@tonkeeper/core/dist/entries/send';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useGetMultisigSender } from '../useSender';
import { useTonAssetTransferService } from '../useBlockchainService';

export function useEstimateNewMultisigTransfer(
    recipient: TonRecipientData,
    amount: AssetAmount<TonAsset>,
    isMax: boolean
) {
    const getSender = useGetMultisigSender('estimate');
    const transferService = useTonAssetTransferService();

    return useMutation<TransferEstimation<TonAsset>, Error>(async () => {
        const ttlSeconds = Number(5) * 60;

        const sender = await getSender(ttlSeconds);

        const comment = (recipient as TonRecipientData).comment;
        const result = await transferService.estimate(sender, {
            to: seeIfValidTonAddress(recipient.address.address)
                ? recipient.address.address
                : recipient.toAccount.address,
            amount: amount as AssetAmount<TonAsset>,
            isMax,
            payload: comment ? { type: 'comment', value: comment } : undefined
        });

        return {
            fee: new AssetAmount({
                weiAmount: Math.abs(result.payload.event.extra),
                asset: TON_ASSET
            }),
            payload: result.payload
        };
    });
}
