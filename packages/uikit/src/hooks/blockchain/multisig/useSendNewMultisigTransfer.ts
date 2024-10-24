import { useMutation } from '@tanstack/react-query';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonEstimation, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { useInvalidateActiveWalletQueries } from '../../../state/wallet';
import { useTransactionAnalytics } from '../../amplitude';
import { MultisigOrderLifetimeMinutes } from '../../../libs/multisig';
import { useTonAssetTransferService } from '../useBlockchainService';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
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
    const track2 = useTransactionAnalytics();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<boolean, Error>(async () => {
        try {
            const ttlSeconds = Number(ttl) * 60;

            const sender = await getSender({ type: 'multisig', ttlSeconds });

            const comment = (recipient as TonRecipientData).comment;
            await transferService.send(sender, estimation, {
                to: seeIfValidTonAddress(recipient.address.address)
                    ? recipient.address.address
                    : recipient.toAccount.address,
                amount: amount as AssetAmount<TonAsset>,
                isMax,
                payload: comment ? { type: 'comment', value: comment } : undefined
            });

            if (amount.asset.id === TON_ASSET.id) {
                track2('send-ton');
            } else {
                track2('send-jetton');
            }
        } catch (e) {
            await notifyError(e);
        }

        await invalidateAccountQueries();
        return true;
    });
}
