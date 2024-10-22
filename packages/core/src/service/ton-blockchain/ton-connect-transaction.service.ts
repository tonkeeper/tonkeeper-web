import { APIConfig } from '../../entries/apis';
import { LedgerMessageSender, Sender } from './sender';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonAsset } from '../../entries/crypto/asset/ton-asset';
import { TON_ASSET } from '../../entries/crypto/asset/constants';
import BigNumber from 'bignumber.js';
import { Estimation, TransferEstimation } from '../../entries/send';
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
        estimation: Estimation<TonAsset>,
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
        estimation?: Estimation<TonAsset>
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

        if (estimation) {
            requiredBalance = requiredBalance.plus(estimation.fee.weiAmount);
        }

        await assertBalanceEnough(this.api, requiredBalance, this.wallet.rawAddress);
    }
}
