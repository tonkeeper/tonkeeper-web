import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    RecipientData,
    TonRecipientData,
    TransferEstimation,
    TransferEstimationEvent
} from '@tonkeeper/core/dist/entries/send';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { estimateJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { estimateTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { JettonsBalances } from '@tonkeeper/core/dist/tonApiV2';
import { notifyError } from '../../components/transfer/common';
import { QueryKey } from '../../libs/queryKey';
import { useJettonList } from '../../state/jetton';
import { DefaultRefetchInterval } from '../../state/tonendpoint';
import { useAppContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import { useActiveStandardTonWallet } from '../../state/wallet';

async function estimateTon({
    recipient,
    amount,
    isMax,
    api,
    wallet,
    jettons
}: {
    recipient: RecipientData;
    amount: AssetAmount<TonAsset>;
    isMax: boolean;
    api: APIConfig;
    wallet: TonWalletStandard;
    jettons: JettonsBalances | undefined;
}): Promise<TransferEstimation<TonAsset>> {
    let payload: TransferEstimationEvent;
    if (amount.asset.id === TON_ASSET.id) {
        payload = await estimateTonTransfer(
            api,
            wallet,
            recipient as TonRecipientData,
            amount.weiAmount,
            isMax
        );
    } else {
        const jettonInfo = jettons!.balances.find(
            jetton => (amount.asset.address as Address).toRawString() === jetton.jetton.address
        )!;
        payload = await estimateJettonTransfer(
            api,
            wallet,
            recipient as TonRecipientData,
            amount as AssetAmount<TonAsset>,
            jettonInfo.walletAddress.address
        );
    }

    const fee = new AssetAmount({ asset: TON_ASSET, weiAmount: payload.event.extra * -1 });
    return { fee, payload };
}

export function useEstimateTransfer(
    recipient: RecipientData,
    amount: AssetAmount<Asset>,
    isMax: boolean
) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useActiveStandardTonWallet();
    const client = useQueryClient();
    const { data: jettons } = useJettonList();
    /*const { data: balances } = useTronBalances();*/

    return useQuery<TransferEstimation<Asset>, Error>(
        [QueryKey.estimate, recipient, amount],
        async () => {
            try {
                if (isTonAsset(amount.asset)) {
                    return await estimateTon({
                        amount: amount as AssetAmount<TonAsset>,
                        api: api,
                        wallet,
                        recipient,
                        isMax,
                        jettons
                    });
                } else {
                    /* return await estimateTron({
                        amount: amount as AssetAmount<TronAsset>,
                        tronApi: api.tronApi,
                        wallet,
                        recipient,
                        isMax,
                        balances
                    });*/

                    throw new Error('Tron is not supported');
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
