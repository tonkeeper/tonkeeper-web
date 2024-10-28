import { APIConfig } from '../../entries/apis';
import { LedgerMessageSender, Sender } from './sender';
import BigNumber from 'bignumber.js';
import { getTonEstimationTonFee, TonEstimation } from '../../entries/send';
import { isStandardTonWallet, TonContract } from '../../entries/wallet';
import { TonConnectTransactionPayload } from '../../entries/tonConnect';
import { TonConnectEncoder } from './encoder/ton-connect-encoder';
import { assertMessagesNumberSupported, assertBalanceEnough } from './utils';
import { Cell } from '@ton/core';

export class TonConnectTransactionService {
    constructor(private readonly api: APIConfig, private readonly wallet: TonContract) {}

    async estimate(
        sender: Sender,
        transaction: TonConnectTransactionPayload
    ): Promise<TonEstimation> {
        await this.checkTransactionPossibility(transaction);

        if (sender instanceof LedgerMessageSender) {
            return (await sender.tonConnectTransfer(transaction)).estimate();
        } else {
            return sender.estimate(
                await new TonConnectEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                    transaction
                )
            );
        }
    }

    async send(
        sender: Sender,
        estimation: TonEstimation,
        transaction: TonConnectTransactionPayload
    ): Promise<string> {
        await this.checkTransactionPossibility(transaction, estimation);

        let cell: Cell;
        if (sender instanceof LedgerMessageSender) {
            cell = await (await sender.tonConnectTransfer(transaction)).send();
        } else {
            cell = await sender.send(
                await new TonConnectEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                    transaction
                )
            );
        }

        return cell.toBoc().toString('base64');
    }

    private async checkTransactionPossibility(
        transaction: TonConnectTransactionPayload,
        estimation?: TonEstimation
    ) {
        if (isStandardTonWallet(this.wallet)) {
            assertMessagesNumberSupported(transaction.messages.length, this.wallet.version);
        }
        if (transaction.valid_until * 1000 < Date.now()) {
            throw new Error('Transaction expired');
        }

        let requiredBalance = transaction.messages.reduce(
            (acc, p) => acc.plus(p.amount),
            new BigNumber(0)
        );

        requiredBalance = requiredBalance.plus(getTonEstimationTonFee(estimation));

        await assertBalanceEnough(this.api, requiredBalance, this.wallet.rawAddress);
    }
}
