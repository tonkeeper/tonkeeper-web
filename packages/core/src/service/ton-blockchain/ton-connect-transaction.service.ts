import { APIConfig } from '../../entries/apis';
import { LedgerMessageSender, Sender } from './sender';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonAsset } from '../../entries/crypto/asset/ton-asset';
import { TON_ASSET } from '../../entries/crypto/asset/constants';
import BigNumber from 'bignumber.js';
import { assertBalanceEnough } from '../transfer/common';
import { TransferEstimation } from '../../entries/send';
import { TonWalletStandard } from '../../entries/wallet';
import { checkMaxAllowedMessagesInMultiTransferOrDie } from '../transfer/multiSendService';
import { TonConnectTransactionPayload } from '../../entries/tonConnect';
import { TonConnectEncoder } from './encoder/ton-connect-encoder';

export class TonConnectTransactionService {
    constructor(private readonly api: APIConfig, private readonly wallet: TonWalletStandard) {}

    async estimate(
        sender: Sender,
        transaction: TonConnectTransactionPayload
    ): Promise<TransferEstimation<TonAsset>> {
        await this.checkTransactionPossibility(transaction);

        let estimation;
        if (sender instanceof LedgerMessageSender) {
            estimation = await (await sender.tonConnectTransfer(transaction)).estimate();
        } else {
            estimation = await sender.estimate(
                await new TonConnectEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                    transaction
                )
            );
        }

        const fee = new AssetAmount({
            asset: TON_ASSET,
            weiAmount: Math.abs(estimation.event.extra)
        });

        return {
            fee,
            payload: estimation
        };
    }

    async send(
        sender: Sender,
        estimation: TransferEstimation<TonAsset>,
        transaction: TonConnectTransactionPayload
    ) {
        await this.checkTransactionPossibility(transaction, estimation);

        if (sender instanceof LedgerMessageSender) {
            return (await sender.tonConnectTransfer(transaction)).send();
        } else {
            return sender.send(
                await new TonConnectEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                    transaction
                )
            );
        }
    }

    private async checkTransactionPossibility(
        transaction: TonConnectTransactionPayload,
        estimation?: TransferEstimation<TonAsset>
    ) {
        checkMaxAllowedMessagesInMultiTransferOrDie(
            transaction.messages.length,
            this.wallet.version
        );
        if (transaction.valid_until * 1000 < Date.now()) {
            throw new Error('Transaction expired');
        }

        let requiredBalance = transaction.messages.reduce(
            (acc, p) => acc.plus(p.amount),
            new BigNumber(0)
        );

        if (estimation) {
            requiredBalance = requiredBalance.plus(estimation.fee.weiAmount);
        }

        await assertBalanceEnough(this.api, requiredBalance, this.wallet.rawAddress);
    }
}
