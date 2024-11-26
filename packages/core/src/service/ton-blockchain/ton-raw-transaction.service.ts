import { APIConfig } from '../../entries/apis';
import {
    BatteryMessageSender,
    GaslessMessageSender,
    LedgerMessageSender,
    Sender,
    WalletMessageSender
} from './sender';
import BigNumber from 'bignumber.js';
import { getTonEstimationTonFee, TonEstimation } from '../../entries/send';
import { TonContract } from '../../entries/wallet';
import { Address, Cell, internal, SendMode } from '@ton/core';
import { assertBalanceEnough } from './utils';
import { TON_ASSET } from '../../entries/crypto/asset/constants';
import { maxBigNumber } from '../../utils/common';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';

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

    async estimate(
        sender: Sender,
        transaction: TonRawTransaction | OutActionWalletV5[]
    ): Promise<TonEstimation> {
        if (!Array.isArray(transaction)) {
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

        if (!(sender instanceof WalletMessageSender)) {
            throw new Error(
                `Sender ${sender.constructor.name} does not support this messages type`
            );
        }

        return sender.estimate(transaction);
    }

    async send(
        sender: Sender,
        estimation: TonEstimation,
        transaction: TonRawTransaction | OutActionWalletV5[]
    ) {
        if (!Array.isArray(transaction)) {
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

            return;
        }

        if (!(sender instanceof WalletMessageSender)) {
            throw new Error(
                `Sender ${sender.constructor.name} does not support this messages type`
            );
        }

        await sender.send(transaction);
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
