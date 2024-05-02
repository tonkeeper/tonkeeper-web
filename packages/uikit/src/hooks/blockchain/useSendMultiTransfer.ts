import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TonRecipient } from '@tonkeeper/core/dist/entries/send';
import {
    TransferMessage,
    sendJettonMultiTransfer,
    sendTonMultiTransfer
} from '@tonkeeper/core/dist/service/transfer/multiSendService';
import BigNumber from 'bignumber.js';
import { notifyError } from '../../components/transfer/common';
import { getSigner } from '../../state/mnemonic';
import { useWalletJettonList } from '../../state/wallet';
import { useTransactionAnalytics } from '../amplitude';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';

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

export function useSendMultiTransfer() {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();
    const { data: jettons } = useWalletJettonList();

    return useMutation<
        boolean,
        Error,
        { form: MultiSendFormTokenized; asset: TonAsset; feeEstimation: BigNumber }
    >(async ({ form, asset, feeEstimation }) => {
        const signer = await getSigner(sdk, wallet.publicKey).catch(() => null);
        if (signer === null) return false;
        try {
            if (signer.type !== 'cell') {
                throw new Error('Current wallet does not support multisend');
            }

            if (asset.id === TON_ASSET.id) {
                track2('multi-send-ton');
                await sendTonMultiTransfer(
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
                await sendJettonMultiTransfer(
                    api,
                    wallet,
                    jettonInfo.walletAddress.address,
                    multiSendFormToTransferMessages(form),
                    feeEstimation,
                    signer
                );
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
