import { useMutation } from '@tanstack/react-query';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useAppContext, useWalletContext } from '../appContext';
import { useWalletJettonList } from '../../state/wallet';
import {
    estimateTonMultiTransfer,
    estimateJettonMultiTransfer
} from '@tonkeeper/core/dist/service/transfer/multiSendService';
import { MultiSendFormTokenized, multiSendFormToTransferMessages } from './useSendMultiTransfer';
import BigNumber from 'bignumber.js';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { Address } from '@ton/core';
import { AccountEvent } from '@tonkeeper/core/dist/tonApiV2';

export function useEstimateMultiTransfer() {
    const { api } = useAppContext();
    const wallet = useWalletContext();
    const { data: jettons } = useWalletJettonList();

    return useMutation<
        { fee: AssetAmount<TonAsset>; estimation: AccountEvent },
        Error,
        { form: MultiSendFormTokenized; asset: TonAsset }
    >(async ({ form, asset }) => {
        if (asset.id === TON_ASSET.id) {
            const estimation = await estimateTonMultiTransfer(
                api,
                wallet,
                multiSendFormToTransferMessages(form)
            );
            const total = new BigNumber(estimation.extra);

            const fee = new AssetAmount({
                asset: TON_ASSET,
                weiAmount: total.multipliedBy(-1)
            });
            return { fee, estimation };
        } else {
            const jettonInfo = jettons!.balances.find(
                jetton => (asset.address as Address).toRawString() === jetton.jetton.address
            )!;

            const estimation = await estimateJettonMultiTransfer(
                api,
                wallet,
                jettonInfo.walletAddress.address,
                multiSendFormToTransferMessages(form)
            );
            const total = new BigNumber(estimation.extra);

            const fee = new AssetAmount({
                asset: TON_ASSET,
                weiAmount: total.multipliedBy(-1)
            });
            return { fee, estimation };
        }
    });
}
