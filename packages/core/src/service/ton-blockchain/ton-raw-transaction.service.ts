import { APIConfig } from '../../entries/apis';
import { LedgerMessageSender, Sender } from './sender';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonAsset } from '../../entries/crypto/asset/ton-asset';
import { TON_ASSET } from '../../entries/crypto/asset/constants';
import BigNumber from 'bignumber.js';
import { Estimation, TransferEstimation } from '../../entries/send';
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

    async estimate(
        sender: Sender,
        transaction: TonRawTransaction
    ): Promise<TransferEstimation<TonAsset>> {
        await this.checkTransactionPossibility(transaction);

        let estimation;
        if (sender instanceof LedgerMessageSender) {
            estimation = await (
                await sender.tonRawTransfer({
                    sendMode: SendMode.IGNORE_ERRORS,
                    bounce: true,
                    ...transaction
                })
            ).estimate();
        } else {
            estimation = await sender.estimate({
                messages: [internal({ bounce: true, ...transaction })],
                sendMode: SendMode.IGNORE_ERRORS
            });
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

    async send(sender: Sender, estimation: Estimation<TonAsset>, transaction: TonRawTransaction) {
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
        estimation?: Estimation<TonAsset>
    ) {
        let requiredBalance = new BigNumber(transaction.value.toString());

        if (estimation) {
            requiredBalance = requiredBalance.plus(estimation.fee.weiAmount);
        }

        await assertBalanceEnough(this.api, requiredBalance, this.wallet.rawAddress);
    }
}
