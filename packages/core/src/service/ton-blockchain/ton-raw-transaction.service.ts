import { APIConfig } from '../../entries/apis';
import { LedgerMessageSender, Sender } from './sender';
import BigNumber from 'bignumber.js';
import { TonEstimation } from '../../entries/send';
import { TonContract } from '../../entries/wallet';
import { Address, Cell, internal, SendMode } from '@ton/core';
import { assertBalanceEnough } from './utils';

export type TonRawTransaction = {
    to: Address;
    value: bigint;
    bounce?: boolean;
    body?: Cell;
    stateInit?: Cell;
    sendMode?: SendMode;
};

/**
 * @description use to call TON contracts. For user transfers use {@link TonAssetTransactionService}
 */
export class TonRawTransactionService {
    constructor(private readonly api: APIConfig, private readonly wallet: TonContract) {}

    async estimate(sender: Sender, transaction: TonRawTransaction): Promise<TonEstimation> {
        await this.checkTransactionPossibility(transaction);

        if (sender instanceof LedgerMessageSender) {
            return (
                await sender.tonRawTransfer({
                    sendMode: SendMode.IGNORE_ERRORS,
                    bounce: true,
                    ...transaction
                })
            ).estimate();
        } else {
            return sender.estimate({
                messages: [internal({ bounce: true, ...transaction })],
                sendMode: SendMode.IGNORE_ERRORS
            });
        }
    }

    async send(sender: Sender, estimation: TonEstimation, transaction: TonRawTransaction) {
        await this.checkTransactionPossibility(transaction, estimation);

        if (sender instanceof LedgerMessageSender) {
            await (
                await sender.tonRawTransfer({
                    sendMode: SendMode.IGNORE_ERRORS,
                    bounce: true,
                    ...transaction
                })
            ).send();
        } else {
            await sender.send({
                messages: [internal({ bounce: true, ...transaction })],
                sendMode: SendMode.IGNORE_ERRORS
            });
        }
    }

    private async checkTransactionPossibility(
        transaction: TonRawTransaction,
        estimation?: TonEstimation
    ) {
        let requiredBalance = new BigNumber(transaction.value.toString());

        if (estimation) {
            requiredBalance = requiredBalance.plus(estimation.fee.weiAmount);
        }

        await assertBalanceEnough(this.api, requiredBalance, this.wallet.rawAddress);
    }
}
