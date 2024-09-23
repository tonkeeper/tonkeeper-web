import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonRecipientData, TransferEstimationEventFee } from '@tonkeeper/core/dist/entries/send';
import { sendMultisigJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { sendMultisigTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { useTranslation } from '../../translation';
import { useAppSdk } from '../../appSdk';
import { useAppContext } from '../../appContext';
import { useInvalidateActiveWalletQueries } from '../../../state/wallet';
import { useTransactionAnalytics } from '../../amplitude';
import { useJettonList } from '../../../state/jetton';
import { useCheckTouchId } from '../../../state/password';
import { getSigner } from '../../../state/mnemonic';
import { useActiveMultisigAccountHost, useActiveMultisigWalletInfo } from '../../../state/multisig';
import { MultisigOrderLifetimeMinutes } from '../../../libs/multisig';
import { useAsyncQueryData } from '../../useAsyncQueryData';
import { notifyError } from '../../../components/transfer/common';

export function useSendNewMultisigTransfer(
    recipient: TonRecipientData,
    amount: AssetAmount<TonAsset>,
    isMax: boolean,
    ttl: MultisigOrderLifetimeMinutes,
    estimation: TransferEstimationEventFee
) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const { signerWallet, signerAccount } = useActiveMultisigAccountHost();
    const { data: multisigInfoData } = useActiveMultisigWalletInfo();
    const multisigInfoPromise = useAsyncQueryData(multisigInfoData);
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();
    const { data: jettons } = useJettonList();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<boolean, Error>(async () => {
        try {
            const ttlSeconds = Number(ttl) * 60;

            const signer = await getSigner(sdk, signerAccount.id, checkTouchId, {
                walletId: signerWallet.id
            }).catch(() => null);
            if (signer === null || signer.type !== 'cell') {
                throw new Error('Signer not found');
            }

            const multisig = await multisigInfoPromise;
            if (!multisig) {
                throw new Error('Multisig not found');
            }

            if (amount.asset.id === TON_ASSET.id) {
                track2('send-ton');
                await sendMultisigTonTransfer({
                    api,
                    hostWallet: signerWallet,
                    recipient: recipient as TonRecipientData,
                    multisig,
                    weiAmount: amount.weiAmount,
                    isMax,
                    fee: estimation,
                    signer,
                    ttlSeconds
                });
            } else {
                track2('send-jetton');
                const jettonInfo = jettons!.balances.find(
                    jetton =>
                        (amount.asset.address as Address).toRawString() === jetton.jetton.address
                )!;
                await sendMultisigJettonTransfer({
                    api,
                    hostWallet: signerWallet,
                    recipient: recipient as TonRecipientData,
                    multisig,
                    amount,
                    jettonWalletAddress: jettonInfo!.walletAddress.address,
                    signer,
                    ttlSeconds,
                    fee: estimation
                });
            }
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await invalidateAccountQueries();
        return true;
    });
}
