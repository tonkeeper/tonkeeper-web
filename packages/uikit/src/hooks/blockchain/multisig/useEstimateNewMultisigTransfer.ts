import { useQuery } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonEstimation, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useTonAssetTransferService } from '../useBlockchainService';
import { useGetEstimationSender } from '../useSender';
import { useToQueryKeyPart } from '../../useToQueryKeyPart';

const multisigEstimateSenderChoice = {
    type: 'multisig',
    ttlSeconds: 60 * 5
} as const;

export function useEstimateNewMultisigTransfer(
    recipient: TonRecipientData,
    amount: AssetAmount<TonAsset>,
    isMax: boolean
) {
    const getSender = useGetEstimationSender(multisigEstimateSenderChoice);
    const getSenderKey = useToQueryKeyPart(getSender);
    const transferService = useTonAssetTransferService();

    return useQuery<TonEstimation, Error>(
        ['multisig-transfer-estimation', recipient, amount, isMax, getSenderKey],
        async () => {
            const sender = await getSender!();

            const comment = (recipient as TonRecipientData).comment;
            return transferService.estimate(sender, {
                to: seeIfValidTonAddress(recipient.address.address)
                    ? recipient.address.address
                    : recipient.toAccount.address,
                amount: amount as AssetAmount<TonAsset>,
                isMax,
                payload: comment ? { type: 'comment', value: comment } : undefined
            });
        },
        {
            enabled: !!recipient,
            refetchOnMount: 'always'
        }
    );
}
