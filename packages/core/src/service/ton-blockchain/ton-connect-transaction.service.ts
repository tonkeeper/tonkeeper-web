import { APIConfig } from '../../entries/apis';
import {
    BatteryMessageSender,
    GaslessMessageSender,
    LedgerMessageSender,
    MultisigCreateOrderSender,
    Sender,
    WalletMessageSender
} from './sender';
import BigNumber from 'bignumber.js';
import { getTonEstimationTonFee, TonEstimation } from '../../entries/send';
import { isStandardTonWallet, TonContract } from '../../entries/wallet';
import {
    TON_CONNECT_MSG_VARIANTS_ID,
    TonConnectTransactionPayload
} from '../../entries/tonConnect';
import { TonConnectEncoder } from './encoder/ton-connect-encoder';
import { assertBalanceEnough, assertMessagesNumberSupported } from './utils';
import { Cell } from '@ton/core';
import { assertUnreachable } from '../../utils/types';
import { TON_ASSET } from '../../entries/crypto/asset/constants';
import { maxBigNumber } from '../../utils/common';

export class TonConnectTransactionService {
    constructor(private readonly api: APIConfig, private readonly wallet: TonContract) {}

    async estimate(
        sender: Sender,
        transaction: TonConnectTransactionPayload
    ): Promise<TonEstimation> {
        await this.checkTransactionPossibility(sender, transaction);

        if (sender instanceof LedgerMessageSender) {
            return (await sender.tonConnectTransfer(transaction)).estimate();
        } else {
            return sender.estimate(
                await new TonConnectEncoder(this.api, this.wallet.rawAddress).encodeTransfer({
                    ...transaction,
                    variant: this.getVariantBySender(sender)
                })
            );
        }
    }

    async send(
        sender: Sender,
        estimation: TonEstimation,
        transaction: TonConnectTransactionPayload
    ): Promise<string> {
        await this.checkTransactionPossibility(sender, transaction, estimation);

        let cell: Cell;
        if (sender instanceof LedgerMessageSender) {
            cell = await (await sender.tonConnectTransfer(transaction)).send();
        } else {
            cell = await sender.send(
                await new TonConnectEncoder(this.api, this.wallet.rawAddress).encodeTransfer({
                    ...transaction,
                    variant: this.getVariantBySender(sender)
                })
            );
        }

        return cell.toBoc().toString('base64');
    }

    private getVariantBySender(sender: Sender): TON_CONNECT_MSG_VARIANTS_ID | 'standard' {
        if (sender instanceof BatteryMessageSender) {
            return TON_CONNECT_MSG_VARIANTS_ID.BATTERY;
        }

        if (sender instanceof GaslessMessageSender) {
            return TON_CONNECT_MSG_VARIANTS_ID.GASLESS;
        }

        if (
            sender instanceof LedgerMessageSender ||
            sender instanceof MultisigCreateOrderSender ||
            sender instanceof WalletMessageSender
        ) {
            return 'standard';
        }

        assertUnreachable(sender);
    }

    private async checkTransactionPossibility(
        sender: Sender,
        transaction: TonConnectTransactionPayload,
        estimation?: TonEstimation
    ) {
        if (isStandardTonWallet(this.wallet)) {
            assertMessagesNumberSupported(transaction.messages.length, this.wallet.version);
        }
        if (transaction.valid_until * 1000 < Date.now()) {
            throw new Error('Transaction expired');
        }

        if (sender instanceof BatteryMessageSender || sender instanceof GaslessMessageSender) {
            return;
        }

        let requiredBalance = transaction.messages.reduce(
            (acc, p) => acc.plus(p.amount),
            new BigNumber(0)
        );

        requiredBalance = maxBigNumber(requiredBalance, getTonEstimationTonFee(estimation));

        await assertBalanceEnough(this.api, requiredBalance, TON_ASSET, this.wallet.rawAddress);
    }
}
