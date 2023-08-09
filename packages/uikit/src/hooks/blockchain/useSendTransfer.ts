import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonRecipientData, TronRecipientData } from '@tonkeeper/core/dist/entries/send';
import { sendJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { sendTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { sendTronTransfer } from '@tonkeeper/core/dist/service/tron/tronService';
import { Fee } from '@tonkeeper/core/dist/tonApiV1';
import { EstimatePayload } from '@tonkeeper/core/dist/tronApi';
import { Address } from 'ton-core';
import { notifyError } from '../../components/transfer/common';
import { getWalletPassword } from '../../state/password';
import { useWalletJettonList } from '../../state/wallet';
import { useTransactionAnalytics } from '../amplitude';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import { TransferEstimation } from './useEstimateTransfer';

export function useSendTransfer<T extends Asset>(
    recipient: T extends TonAsset ? TonRecipientData : TronRecipientData,
    amount: AssetAmount<T>,
    isMax: boolean,
    estimation: TransferEstimation<T>
) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { tonApi, tronApi } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();
    const { data: jettons } = useWalletJettonList();

    return useMutation<boolean, Error>(async () => {
        const password = await getWalletPassword(sdk, 'confirm').catch(() => null);
        if (password === null) return false;
        try {
            if (isTonAsset(amount.asset)) {
                if (amount.asset.id === TON_ASSET.id) {
                    track2('send-ton');
                    await sendTonTransfer(
                        sdk.storage,
                        tonApi,
                        wallet,
                        recipient as TonRecipientData,
                        amount,
                        isMax,
                        estimation.payload as Fee,
                        password
                    );
                } else {
                    track2('send-jetton');
                    const jettonInfo = jettons!.balances.find(
                        jetton =>
                            (amount.asset.address as Address).toRawString() === jetton.jettonAddress
                    )!;
                    await sendJettonTransfer(
                        sdk.storage,
                        tonApi,
                        wallet,
                        recipient as TonRecipientData,
                        amount as AssetAmount<TonAsset>,
                        jettonInfo!.walletAddress.address,
                        estimation.payload as Fee,
                        password
                    );
                }
            } else {
                track2('send-trc20');
                await sendTronTransfer(
                    {
                        tronApi,
                        tron: wallet.tron!,
                        request: (estimation.payload as EstimatePayload).request
                    },
                    {
                        password,
                        storage: sdk.storage,
                        walletState: wallet
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
