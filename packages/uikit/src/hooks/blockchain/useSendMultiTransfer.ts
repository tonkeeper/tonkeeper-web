import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonEstimation, TonRecipient } from '@tonkeeper/core/dist/entries/send';

import BigNumber from 'bignumber.js';
import { useTrackTransactionSent } from '../analytics/events-hooks';
import { useActiveAccount } from '../../state/wallet';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useNotifyErrorHandle } from '../useNotification';
import { TonSenderChoiceUserAvailable, useGetSender } from './useSender';
import { useTonAssetTransferService } from './useBlockchainService';
import { TransferParams } from '@tonkeeper/core/dist/service/ton-blockchain/ton-asset-transaction.service';

export type MultiSendFormTokenized = {
    rows: {
        receiver: TonRecipient | null;
        weiAmount: BigNumber;
        comment?: string;
    }[];
};

export function multiSendFormToTransferMessages(
    asset: TonAsset,
    form: MultiSendFormTokenized
): TransferParams {
    return form.rows.map(row => {
        return {
            to: row.receiver!.address,
            amount: new AssetAmount({ asset, weiAmount: row.weiAmount }),
            bounce:
                (row.receiver as { bounce?: boolean }).bounce ??
                !(row.receiver && 'dns' in row.receiver),
            payload: row.comment ? { type: 'comment', value: row.comment } : undefined
        };
    });
}

export function useSendMultiTransfer() {
    const account = useActiveAccount();
    const client = useQueryClient();
    const trackTransactionSent = useTrackTransactionSent();

    const notifyError = useNotifyErrorHandle();
    const getSender = useGetSender();
    const transferService = useTonAssetTransferService();

    return useMutation<
        boolean,
        Error,
        {
            form: MultiSendFormTokenized;
            asset: TonAsset;
            estimation: TonEstimation;
            senderChoice: TonSenderChoiceUserAvailable;
        }
    >(async ({ form, asset, estimation, senderChoice }) => {
        const walletId = account.activeTonWallet.id;
        try {
            if (!isAccountTonWalletStandard(account)) {
                throw new Error("Can't send a transfer using this account");
            }

            if (account.type === 'ledger') {
                throw new Error("Can't estimate fee using ledger account");
            }

            await transferService.send(
                await getSender(senderChoice),
                estimation,
                multiSendFormToTransferMessages(asset, form)
            );

            trackTransactionSent(asset.id === TON_ASSET.id ? 'TonTransfer' : 'JettonTransfer');
        } catch (e) {
            await notifyError(e);
        }

        await client.invalidateQueries({
            predicate: query => query.queryKey.includes(walletId)
        });
        return true;
    });
}
