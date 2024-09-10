import { useMutation } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    TonRecipientData,
    TransferEstimation,
    TransferEstimationEvent
} from '@tonkeeper/core/dist/entries/send';
import { estimateMultisigJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { estimateMultisigTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { useAppContext } from '../../appContext';
import { useJettonList } from '../../../state/jetton';
import { useActiveMultisigSignerInfo, useActiveMultisigWalletInfo } from '../../../state/multisig';
import { useAsyncQueryData } from '../../useAsyncQueryData';

export function useEstimateNewMultisigTransfer(
    recipient: TonRecipientData,
    amount: AssetAmount<TonAsset>,
    isMax: boolean
) {
    const { api } = useAppContext();
    const { data: multisigInfoData } = useActiveMultisigWalletInfo();
    const multisigInfoPromise = useAsyncQueryData(multisigInfoData);
    const signerInfoData = useActiveMultisigSignerInfo();
    const signerInfoPromise = useAsyncQueryData(signerInfoData);
    const { data: jettons } = useJettonList();

    return useMutation<TransferEstimation<TonAsset>, Error>(async () => {
        const signerInfo = await signerInfoPromise;
        if (!signerInfo) {
            throw new Error('Signer not found');
        }

        const multisig = await multisigInfoPromise;
        if (!multisig) {
            throw new Error('Multisig not found');
        }

        let payload: TransferEstimationEvent;

        if (amount.asset.id === TON_ASSET.id) {
            payload = await estimateMultisigTonTransfer({
                api,
                hostWallet: signerInfo.wallet,
                recipient: recipient,
                multisig,
                weiAmount: amount.weiAmount,
                isMax
            });
        } else {
            const jettonInfo = jettons!.balances.find(
                jetton => (amount.asset.address as Address).toRawString() === jetton.jetton.address
            )!;
            payload = await estimateMultisigJettonTransfer({
                api,
                hostWallet: signerInfo.wallet,
                recipient: recipient,
                multisig,
                amount,
                jettonWalletAddress: jettonInfo!.walletAddress.address
            });
        }

        return {
            fee: new AssetAmount({ weiAmount: payload.event.extra * -1, asset: TON_ASSET }),
            payload
        };
    });
}
