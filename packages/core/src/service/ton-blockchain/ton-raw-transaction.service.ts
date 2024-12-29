import { APIConfig } from '../../entries/apis';
import { BatteryMessageSender, GaslessMessageSender, LedgerMessageSender, Sender } from './sender';
import BigNumber from 'bignumber.js';
import { getTonEstimationTonFee, TonEstimation } from '../../entries/send';
import { TonContract } from '../../entries/wallet';
import { Address, Cell, internal, SendMode, StateInit } from '@ton/core';
import { assertBalanceEnough } from './utils';
import { TON_ASSET } from '../../entries/crypto/asset/constants';
import { maxBigNumber } from '../../utils/common';

export type TonRawTransaction = {
    to: Address;
    value: bigint;
    bounce?: boolean;
    body?: Cell;
    init?: StateInit;
    sendMode?: SendMode;
};

/**
 * @description use to call TON contracts. For user transfers use {@link TonAssetTransactionService}
 */
export class TonRawTransactionService {
    constructor(private readonly api: APIConfig, private readonly wallet: TonContract) {}

    async estimate(sender: Sender, transaction: TonRawTransaction): Promise<TonEstimation> {
        await this.checkTransactionPossibility(sender, transaction);

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
        await this.checkTransactionPossibility(sender, transaction, estimation);

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
        sender: Sender,
        transaction: TonRawTransaction,
        estimation?: TonEstimation
    ) {
        if (sender instanceof BatteryMessageSender || sender instanceof GaslessMessageSender) {
            return;
        }

        let requiredBalance = new BigNumber(transaction.value.toString());

        requiredBalance = maxBigNumber(requiredBalance, getTonEstimationTonFee(estimation));

        await assertBalanceEnough(this.api, requiredBalance, TON_ASSET, this.wallet.rawAddress);
    }
}
