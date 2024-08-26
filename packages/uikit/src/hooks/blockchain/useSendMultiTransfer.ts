import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { PendingOutgoingEvent, TonRecipient } from '@tonkeeper/core/dist/entries/send';
import {
    TransferMessage,
    sendJettonMultiTransfer,
    sendTonMultiTransfer
} from '@tonkeeper/core/dist/service/transfer/multiSendService';
import BigNumber from 'bignumber.js';
import { notifyError } from '../../components/transfer/common';
import { TxConfirmationCustomError } from '../../libs/errors/TxConfirmationCustomError';
import { useJettonList } from '../../state/jetton';
import { getSigner } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';
import { useTransactionAnalytics } from '../amplitude';
import { useAppContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import { useActiveAccount, useInvalidateActiveWalletQueries } from '../../state/wallet';
import { isAccountControllable } from '@tonkeeper/core/dist/entries/account';
import { useAddWalletPendingEvent } from '../../state/realtime';

export type MultiSendFormTokenized = {
    rows: {
        receiver: TonRecipient | null;
        weiAmount: BigNumber;
        comment?: string;
    }[];
};

export function multiSendFormToTransferMessages(form: MultiSendFormTokenized): TransferMessage[] {
    return form.rows.map(row => {
        return {
            to: row.receiver!.address,
            weiAmount: row.weiAmount,
            bounce: (row.receiver as { bounce?: boolean }).bounce ?? false,
            comment: row.comment
        };
    });
}

export function useSendMultiTransfer() {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const account = useActiveAccount();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();
    const { data: jettons } = useJettonList();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const { mutateAsync: addPendingEvent } = useAddWalletPendingEvent();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<
        boolean,
        Error,
        { form: MultiSendFormTokenized; asset: TonAsset; feeEstimation: BigNumber }
    >(async ({ form, asset, feeEstimation }) => {
        const signer = await getSigner(sdk, account.id, checkTouchId).catch(() => null);
        if (signer === null) return false;
        try {
            if (!isAccountControllable(account)) {
                throw new Error("Can't send a transfer using this account");
            }

            const wallet = account.activeTonWallet;

            if (signer.type !== 'cell') {
                throw new TxConfirmationCustomError(t('ledger_operation_not_supported'));
            }

            let pendingOutgoingEvent: PendingOutgoingEvent;

            if (asset.id === TON_ASSET.id) {
                track2('multi-send-ton');
                pendingOutgoingEvent = await sendTonMultiTransfer(
                    api,
                    wallet,
                    multiSendFormToTransferMessages(form),
                    feeEstimation,
                    signer
                );
            } else {
                track2('multi-send-jetton');
                const jettonInfo = jettons!.balances.find(
                    jetton => (asset.address as Address).toRawString() === jetton.jetton.address
                )!;
                pendingOutgoingEvent = await sendJettonMultiTransfer(
                    api,
                    wallet,
                    jettonInfo.walletAddress.address,
                    multiSendFormToTransferMessages(form),
                    feeEstimation,
                    signer
                );

                await addPendingEvent({
                    walletAddress: account.activeTonWallet.rawAddress,
                    event: pendingOutgoingEvent
                });
            }
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await invalidateAccountQueries();
        return true;
    });
}
