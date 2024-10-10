import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isTonAsset, Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { isTon, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    TonRecipientData,
    TransferEstimation,
    TronRecipientData
} from '@tonkeeper/core/dist/entries/send';
import { notifyError } from '../../components/transfer/common';
import { getSigner } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';
import { useAnalyticsTrack } from '../amplitude';
import { useAppContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import { useActiveAccount, useInvalidateActiveWalletQueries } from '../../state/wallet';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { TonAssetTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-asset-transaction.service';
import {
    WalletMessageSender,
    LedgerMessageSender
} from '@tonkeeper/core/dist/service/ton-blockchain/sender';

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
    const track = useAnalyticsTrack();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<boolean, Error>(async () => {
        const signer = await getSigner(sdk, account.id, checkTouchId).catch(() => null);
        if (signer === null) return false;
        try {
            if (!isAccountTonWalletStandard(account)) {
                throw new Error("Can't send a transfer using this account");
            }

            if (isTonAsset(amount.asset)) {
                const transferService = new TonAssetTransactionService(
                    api,
                    account.activeTonWallet
                );
                const sender =
                    signer.type === 'ledger'
                        ? new LedgerMessageSender(api, account.activeTonWallet, signer)
                        : new WalletMessageSender(api, account.activeTonWallet, signer);
                await transferService.send(sender, estimation as TransferEstimation<TonAsset>, {
                    to: (recipient as TonRecipientData).toAccount.address,
                    amount: amount as AssetAmount<TonAsset>,
                    isMax,
                    comment: (recipient as TonRecipientData).comment
                });
                track('send_success', {
                    from: 'send_confirm',
                    token: isTon(amount.asset.address) ? 'ton' : amount.asset.symbol
                });
            } else {
                throw new Error('Disable trc 20 transactions');
            }
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await invalidateAccountQueries();
        return true;
    });
}
