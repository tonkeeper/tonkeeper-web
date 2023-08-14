import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET, toTronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { RecipientData, TonRecipientData, TronRecipient } from '@tonkeeper/core/dist/entries/send';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { estimateJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { estimateTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { estimateTronTransfer } from '@tonkeeper/core/dist/service/tron/tronService';
import { Configuration, Fee, JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import {
    Configuration as ConfigurationTron,
    EstimatePayload,
    TronBalances
} from '@tonkeeper/core/dist/tronApi';
import BigNumber from 'bignumber.js';
import { Address } from 'ton-core';
import { notifyError } from '../../components/transfer/common';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval } from '../../state/tonendpoint';
import { useTronBalances } from '../../state/tron/tron';
import { useWalletJettonList } from '../../state/wallet';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';

async function estimateTon({
    recipient,
    amount,
    isMax,
    tonApi,
    wallet,
    jettons
}: {
    recipient: RecipientData;
    amount: AssetAmount<TonAsset>;
    isMax: boolean;
    tonApi: Configuration;
    wallet: WalletState;
    jettons: JettonsBalances | undefined;
}): Promise<TransferEstimation<TonAsset>> {
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
            jetton => (amount.asset.address as Address).toRawString() === jetton.jettonAddress
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
    return { fee, payload };
}

async function estimateTronFee({
    wallet,
    tronApi,
    address,
    amount
}: {
    wallet: WalletState;
    tronApi: ConfigurationTron;
    address: TronRecipient;
    amount: AssetAmount<TronAsset>;
}) {
    const payload = await estimateTronTransfer({
        tron: wallet.tron!,
        tronApi,
        recipient: address,
        amount: AssetAmount.fromRelativeAmount({ asset: amount.asset, amount: new BigNumber('1') })
    });

    return payload.request.fee;
}

async function estimateTron({
    recipient,
    amount,
    isMax,
    tronApi,
    wallet,
    balances
}: {
    recipient: RecipientData;
    amount: AssetAmount<TronAsset>;
    isMax: boolean;
    tronApi: ConfigurationTron;
    wallet: WalletState;
    balances: TronBalances | undefined;
}): Promise<TransferEstimation<TronAsset>> {
    if (isMax) {
        const fee = await estimateTronFee({
            wallet,
            tronApi,
            address: recipient.address as TronRecipient,
            amount
        });

        amount = new AssetAmount({ asset: amount.asset, weiAmount: amount.weiAmount.minus(fee) });
    }

    const payload = await estimateTronTransfer({
        tron: wallet.tron!,
        tronApi,
        recipient: recipient.address as TronRecipient,
        amount: amount
    });

    if (payload.internalMsgs.some(item => item === false)) {
        throw new Error(`Estimation fail.`);
    }

    const feeToken = balances?.balances.find(
        item => item.token.address === payload.request.feeToken
    );
    if (!feeToken) {
        throw new Error(`Unexpected feeToken, token's address is ${payload.request.feeToken}`);
    }

    const fee = new AssetAmount({
        asset: toTronAsset(feeToken),
        weiAmount: payload.request.fee
    });
    return { fee, payload };
}

export type TransferEstimation<T extends Asset = Asset> = {
    fee: AssetAmount<T>;
    payload: T extends TonAsset ? Fee : T extends TronAsset ? EstimatePayload : never;
};

export function useEstimateTransfer(
    recipient: RecipientData,
    amount: AssetAmount<Asset>,
    isMax: boolean
) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { tonApi, tronApi } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const { data: jettons } = useWalletJettonList();
    const { data: balances } = useTronBalances();

    return useQuery<TransferEstimation<Asset>, Error>(
        [QueryKey.estimate, recipient, amount],
        async () => {
            try {
                if (isTonAsset(amount.asset)) {
                    return await estimateTon({
                        amount: amount as AssetAmount<TonAsset>,
                        tonApi,
                        wallet,
                        recipient,
                        isMax,
                        jettons
                    });
                } else {
                    return await estimateTron({
                        amount: amount as AssetAmount<TronAsset>,
                        tronApi,
                        wallet,
                        recipient,
                        isMax,
                        balances
                    });
                }
            } catch (e) {
                await notifyError(client, sdk, t, e);
                throw e;
            }
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchOnMount: 'always'
        }
    );
}
