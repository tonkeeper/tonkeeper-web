import { useMutation } from '@tanstack/react-query';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useAppContext, useWalletContext } from '../appContext';
import { useWalletJettonList } from '../../state/wallet';
import { estimateTonMultiTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { MultiSendFormTokenized, multiSendFormToTransferMessages } from './useSendMultiTransfer';
import BigNumber from 'bignumber.js';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { estimateJettonMultiTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { Address } from '@ton/core';
import { AccountEvent } from '@tonkeeper/core/dist/tonApiV2';

export function useEstimateMultiTransfer(form: MultiSendFormTokenized, asset: TonAsset) {
    const { api } = useAppContext();
    const wallet = useWalletContext();
    const { data: jettons } = useWalletJettonList();

    return useMutation<{ fee: AssetAmount<TonAsset>; estimations: AccountEvent[] }, Error>(
        async () => {
            if (asset.id === TON_ASSET.id) {
                const estimations = await estimateTonMultiTransfer(
                    api,
                    wallet,
                    multiSendFormToTransferMessages(form)
                );
                const total = estimations.reduce((acc, e) => {
                    return acc.plus(e.extra);
                }, new BigNumber(0));

                const fee = new AssetAmount({
                    asset: TON_ASSET,
                    weiAmount: total
                });
                return { fee, estimations };
            } else {
                const jettonInfo = jettons!.balances.find(
                    jetton => (asset.address as Address).toRawString() === jetton.jetton.address
                )!;

                const estimations = await estimateJettonMultiTransfer(
                    api,
                    wallet,
                    jettonInfo.walletAddress.address,
                    multiSendFormToTransferMessages(form)
                );
                const total = estimations.reduce((acc, e) => {
                    return acc.plus(e.extra);
                }, new BigNumber(0));

                const fee = new AssetAmount({
                    asset: TON_ASSET,
                    weiAmount: total
                });
                return { fee, estimations };
            }
        }
    );
}
