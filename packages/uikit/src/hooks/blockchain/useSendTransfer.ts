import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    TonRecipientData,
    TransferEstimation,
    TronRecipientData
} from '@tonkeeper/core/dist/entries/send';
import { sendJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { sendTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { sendTronTransfer } from '@tonkeeper/core/dist/service/tron/tronTransferService';
import { MessageConsequences } from '@tonkeeper/core/dist/tonApiV2';
import { EstimatePayload } from '@tonkeeper/core/dist/tronApi';
import { notifyError } from '../../components/transfer/common';
import { getMnemonic } from '../../state/mnemonic';
import { useWalletJettonList } from '../../state/wallet';
import { useTransactionAnalytics } from '../amplitude';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';

export function useSendTransfer<T extends Asset>(
    recipient: T extends TonAsset ? TonRecipientData : TronRecipientData,
    amount: AssetAmount<T>,
    isMax: boolean,
    estimation: TransferEstimation<T>
) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();
    const { data: jettons } = useWalletJettonList();

    return useMutation<boolean, Error>(async () => {
        const mnemonic = await getMnemonic(sdk, wallet.publicKey).catch(() => null);
        if (mnemonic === null) return false;
        try {
            if (isTonAsset(amount.asset)) {
                if (amount.asset.id === TON_ASSET.id) {
                    track2('send-ton');
                    await sendTonTransfer(
                        api,
                        wallet,
                        recipient as TonRecipientData,
                        amount,
                        isMax,
                        estimation.payload as MessageConsequences,
                        mnemonic
                    );
                } else {
                    track2('send-jetton');
                    const jettonInfo = jettons!.balances.find(
                        jetton =>
                            (amount.asset.address as Address).toRawString() ===
                            jetton.jetton.address
                    )!;
                    await sendJettonTransfer(
                        api,
                        wallet,
                        recipient as TonRecipientData,
                        amount as AssetAmount<TonAsset>,
                        jettonInfo!.walletAddress.address,
                        estimation.payload as MessageConsequences,
                        mnemonic
                    );
                }
            } else {
                track2('send-trc20');
                await sendTronTransfer(
                    {
                        tronApi: api.tronApi,
                        tron: wallet.tron!,
                        request: (estimation.payload as EstimatePayload).request
                    },
                    {
                        mnemonic
                    }
                );
            }
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await client.invalidateQueries([wallet.active.rawAddress]);
        return true;
    });
}
