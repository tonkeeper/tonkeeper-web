import { useMutation } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonEstimation, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { useInvalidateActiveWalletQueries } from '../../../state/wallet';
import { useTrackTransactionSent } from '../../analytics/events-hooks';
import { MultisigOrderLifetimeMinutes } from '../../../libs/multisig';
import { useTonAssetTransferService } from '../useBlockchainService';
import { isTonAddress } from '@tonkeeper/core/dist/utils/address';
import { useNotifyErrorHandle } from '../../useNotification';
import { useGetSender } from '../useSender';

export function useSendNewMultisigTransfer(
    recipient: TonRecipientData,
    amount: AssetAmount<TonAsset>,
    isMax: boolean,
    ttl: MultisigOrderLifetimeMinutes,
    estimation: TonEstimation
) {
    const transferService = useTonAssetTransferService();
    const notifyError = useNotifyErrorHandle();
    const getSender = useGetSender();
    const trackTransactionSent = useTrackTransactionSent();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<boolean, Error>(async () => {
        try {
            const ttlSeconds = Number(ttl) * 60;

            const sender = await getSender({ type: 'multisig', ttlSeconds });

            const comment = (recipient as TonRecipientData).comment;
            await transferService.send(sender, estimation, {
                to: isTonAddress(recipient.address.address)
                    ? recipient.address.address
                    : recipient.toAccount.address,
                amount: amount as AssetAmount<TonAsset>,
                isMax,
                payload: comment ? { type: 'comment', value: comment } : undefined
            });

            trackTransactionSent(
                amount.asset.id === TON_ASSET.id ? 'TonTransfer' : 'JettonTransfer'
            );
        } catch (e) {
            await notifyError(e);
        }

        await invalidateAccountQueries();
        return true;
    });
}
