import { UseQueryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET, toTronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { RecipientData, TonRecipientData, TronRecipient } from '@tonkeeper/core/dist/entries/send';
import { estimateJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { estimateTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { estimateTronTransfer } from '@tonkeeper/core/dist/service/tron/tronService';
import { Fee } from '@tonkeeper/core/dist/tonApiV1';
import { EstimatePayload } from '@tonkeeper/core/dist/tronApi';
import { Address } from 'ton-core';
import { notifyError } from '../../components/transfer/common';
import { useTronBalances } from '../../state/tron/tron';
import { useWalletJettonList } from '../../state/wallet';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';

export type TransferEstimation<T extends Asset = Asset> = {
    fee: AssetAmount<T>;
    payload: T extends TonAsset ? Fee : T extends TronAsset ? EstimatePayload : never;
};

export function useEstimateTransfer<T extends Asset>(
    recipient: RecipientData,
    amount: AssetAmount<T>,
    isMax: boolean,
    options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn' | 'initialData'>
) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { tonApi, tronApi } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const { data: jettons } = useWalletJettonList();
    const { data: balances } = useTronBalances();

    return useQuery<TransferEstimation<T>>(
        ['estimate-transfer', recipient, amount],
        async () => {
            try {
                if (isTonAsset(amount.asset)) {
                    let payload;
                    if (amount.asset.id === TON_ASSET.id) {
                        payload = await estimateTonTransfer(
                            tonApi,
                            wallet,
                            recipient as TonRecipientData,
                            amount.weiAmount,
                            isMax
                        );
                    } else {
                        const jettonInfo = jettons!.balances.find(
                            jetton =>
                                (amount.asset.address as Address).toRawString() ===
                                jetton.jettonAddress
                        )!;
                        payload = await estimateJettonTransfer(
                            tonApi,
                            wallet,
                            recipient as TonRecipientData,
                            amount as AssetAmount<TonAsset>,
                            jettonInfo.walletAddress.address
                        );
                    }

                    const fee = new AssetAmount({ asset: TON_ASSET, weiAmount: payload.total });
                    return { fee, payload } as TransferEstimation<T>;
                }

                const payload = await estimateTronTransfer({
                    tron: wallet.tron!,
                    tronApi,
                    recipient: recipient.address as TronRecipient,
                    amount: amount as AssetAmount<TronAsset>
                });

                const feeToken = balances?.balances.find(
                    item => item.token.address === payload.request.feeToken
                );
                if (!feeToken) {
                    throw new Error(
                        `Unexpected feeToken, token's address is ${payload.request.feeToken}`
                    );
                }

                const fee = new AssetAmount({
                    asset: toTronAsset(feeToken),
                    weiAmount: payload.request.fee
                });
                return { fee, payload } as TransferEstimation<T>;
            } catch (e) {
                await notifyError(client, sdk, t, e);
                throw e;
            }
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options as any
    );
}
