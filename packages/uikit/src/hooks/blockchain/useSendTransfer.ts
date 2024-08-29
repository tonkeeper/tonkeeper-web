import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    TonRecipientData,
    TransferEstimation,
    TransferEstimationEvent,
    TronRecipientData
} from '@tonkeeper/core/dist/entries/send';
import { sendJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { sendTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { notifyError } from '../../components/transfer/common';
import { useJettonList } from '../../state/jetton';
import { getSigner } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';
import { useTransactionAnalytics } from '../amplitude';
import { useAppContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import { useActiveAccount, useInvalidateActiveWalletQueries } from '../../state/wallet';
import { isAccountControllable } from '@tonkeeper/core/dist/entries/account';

export function useSendTransfer<T extends Asset>(
    recipient: T extends TonAsset ? TonRecipientData : TronRecipientData,
    amount: AssetAmount<T>,
    isMax: boolean,
    estimation: TransferEstimation<T>
) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const account = useActiveAccount();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();
    const { data: jettons } = useJettonList();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<boolean, Error>(async () => {
        const signer = await getSigner(sdk, account.id, checkTouchId).catch(() => null);
        if (signer === null) return false;
        try {
            if (!isAccountControllable(account)) {
                throw new Error("Can't send a transfer using this account");
            }
            if (isTonAsset(amount.asset)) {
                if (amount.asset.id === TON_ASSET.id) {
                    track2('send-ton');
                    await sendTonTransfer(
                        api,
                        account,
                        recipient as TonRecipientData,
                        amount,
                        isMax,
                        estimation.payload as TransferEstimationEvent,
                        signer
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
                        account,
                        recipient as TonRecipientData,
                        amount as AssetAmount<TonAsset>,
                        jettonInfo!.walletAddress.address,
                        estimation.payload as TransferEstimationEvent,
                        signer
                    );
                }
            } else {
                throw new Error('Disable trc 20 transactions');
                // track2('send-trc20');
                // await sendTronTransfer(
                //     {
                //         tronApi: api.tronApi,
                //         tron: wallet.tron!,
                //         request: (estimation.payload as EstimatePayload).request
                //     },
                //     {
                //         mnemonic
                //     }
                // );
            }
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await invalidateAccountQueries();
        return true;
    });
}
