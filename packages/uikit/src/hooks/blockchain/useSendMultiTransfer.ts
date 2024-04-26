import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    sendTonMultiTransfer,
    TransferMessage
} from '@tonkeeper/core/dist/service/transfer/tonService';
import { notifyError } from '../../components/transfer/common';
import { getMnemonic } from '../../state/mnemonic';
import { useWalletJettonList } from '../../state/wallet';
import { useTransactionAnalytics } from '../amplitude';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import BigNumber from 'bignumber.js';
import { sendJettonMultiTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { Address } from '@ton/core';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';

export type MultiSendFormTokenized = {
    rows: {
        receiver: TonRecipient | undefined;
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

export function useSendMultiTransfer(
    form: MultiSendFormTokenized,
    asset: TonAsset,
    feeEstimation: BigNumber
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
            if (asset.id === TON_ASSET.id) {
                track2('multi-send-ton');
                await sendTonMultiTransfer(
                    api,
                    wallet,
                    multiSendFormToTransferMessages(form),
                    feeEstimation,
                    mnemonic
                );
                // TODO save queue
            } else {
                track2('multi-send-jetton');
                const jettonInfo = jettons!.balances.find(
                    jetton => (asset.address as Address).toRawString() === jetton.jetton.address
                )!;
                await sendJettonMultiTransfer(
                    api,
                    wallet,
                    jettonInfo.walletAddress.address,
                    multiSendFormToTransferMessages(form),
                    feeEstimation,
                    mnemonic
                );
                // TODO save queue
            }
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await client.invalidateQueries({
            predicate: query => query.queryKey.includes(wallet.active.rawAddress)
        });
        return true;
    });
}
