import { APIConfig } from '../../entries/apis';
import { BatteryMessageSender, Sender } from './sender';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TonAsset } from '../../entries/crypto/asset/ton-asset';
import { TON_ASSET } from '../../entries/crypto/asset/constants';
import { LedgerMessageSender } from './sender/ledger-message-sender';
import { TonEncoder } from './encoder/ton-encoder';
import { JettonEncoder } from './encoder/jetton-encoder';
import BigNumber from 'bignumber.js';
import { assertBalanceEnough } from './utils';
import { TonEstimation } from '../../entries/send';
import { isStandardTonWallet, TonContract } from '../../entries/wallet';
import { MessagePayloadParam } from './encoder/types';
import { assertMessagesNumberSupported } from './utils';

export type TransferParams =
    | {
          to: string;
          amount: AssetAmount<TonAsset>;
          isMax?: boolean;
          payload?: MessagePayloadParam;
      }
    | {
          to: string;
          amount: AssetAmount<TonAsset>;
          bounce: boolean;
          payload?: MessagePayloadParam;
      }[];

export class TonAssetTransactionService {
    constructor(private readonly api: APIConfig, private readonly wallet: TonContract) {}

    async estimate(sender: Sender, params: TransferParams): Promise<TonEstimation> {
        if (this.isJettonTransfer(params)) {
            return this.estimateJetton(sender, params);
        } else {
            return this.estimateTon(sender, params);
        }
    }

    private async estimateTon(sender: Sender, params: TransferParams) {
        await this.checkTransferPossibility(sender, params);

        if (Array.isArray(params)) {
            if (sender instanceof LedgerMessageSender) {
                throw new Error('Ledger multisend is not supported.');
            } else {
                return sender.estimate(
                    await new TonEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                        params.map(p => ({ ...p, weiAmount: p.amount.weiAmount }))
                    )
                );
            }
        } else {
            if (sender instanceof LedgerMessageSender) {
                return (
                    await sender.tonTransfer({ ...params, weiAmount: params.amount.weiAmount })
                ).estimate();
            } else {
                return sender.estimate(
                    await new TonEncoder(this.api, this.wallet.rawAddress).encodeTransfer({
                        ...params,
                        weiAmount: params.amount.weiAmount
                    })
                );
            }
        }
    }

    private async estimateJetton(sender: Sender, params: TransferParams) {
        await this.checkTransferPossibility(sender, params);

        if (Array.isArray(params)) {
            if (sender instanceof LedgerMessageSender) {
                throw new Error('Ledger multisend is not supported.');
            } else {
                return sender.estimate(
                    await new JettonEncoder(this.api, this.wallet.rawAddress).encodeTransfer({
                        responseAddress: sender.jettonResponseAddress,
                        ...params
                    })
                );
            }
        } else {
            if (sender instanceof LedgerMessageSender) {
                return (await sender.jettonTransfer(params)).estimate();
            } else {
                return sender.estimate(
                    await new JettonEncoder(this.api, this.wallet.rawAddress).encodeTransfer({
                        responseAddress: sender.jettonResponseAddress,
                        ...params
                    })
                );
            }
        }
    }

    async send(sender: Sender, estimation: TonEstimation, params: TransferParams) {
        if (this.isJettonTransfer(params)) {
            await this.sendJetton(sender, estimation, params);
        } else {
            await this.sendTon(sender, estimation, params);
        }
    }

    private async sendTon(sender: Sender, estimation: TonEstimation, params: TransferParams) {
        await this.checkTransferPossibility(sender, params, estimation);

        if (Array.isArray(params)) {
            if (sender instanceof LedgerMessageSender) {
                throw new Error('Ledger multisend is not supported.');
            } else {
                return sender.send(
                    await new TonEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                        params.map(p => ({ ...p, weiAmount: p.amount.weiAmount }))
                    )
                );
            }
        } else {
            if (sender instanceof LedgerMessageSender) {
                return (
                    await sender.tonTransfer({ ...params, weiAmount: params.amount.weiAmount })
                ).send();
            } else {
                return sender.send(
                    await new TonEncoder(this.api, this.wallet.rawAddress).encodeTransfer({
                        ...params,
                        weiAmount: params.amount.weiAmount
                    })
                );
            }
        }
    }

    private async sendJetton(sender: Sender, estimation: TonEstimation, params: TransferParams) {
        await this.checkTransferPossibility(sender, params, estimation);

        if (Array.isArray(params)) {
            if (sender instanceof LedgerMessageSender) {
                throw new Error('Ledger multisend is not supported.');
            } else {
                return sender.send(
                    await new JettonEncoder(this.api, this.wallet.rawAddress).encodeTransfer({
                        responseAddress: sender.jettonResponseAddress,
                        ...params
                    })
                );
            }
        } else {
            if (sender instanceof LedgerMessageSender) {
                return (await sender.jettonTransfer(params)).send();
            } else {
                return sender.send(
                    await new JettonEncoder(this.api, this.wallet.rawAddress).encodeTransfer({
                        responseAddress: sender.jettonResponseAddress,
                        ...params
                    })
                );
            }
        }
    }

    private isJettonTransfer(params: TransferParams) {
        return Array.isArray(params)
            ? params[0].amount.asset.id !== TON_ASSET.id
            : params.amount.asset.id !== TON_ASSET.id;
    }

    private async checkTransferPossibility(
        sender: Sender,
        params: TransferParams,
        estimation?: TonEstimation
    ) {
        if (sender instanceof BatteryMessageSender) {
            return;
        }

        const isJettonTransfer = this.isJettonTransfer(params);

        let requiredBalance = Array.isArray(params)
            ? params.reduce(
                  (acc, p) =>
                      acc.plus(
                          isJettonTransfer
                              ? new BigNumber(JettonEncoder.jettonTransferAmount.toString())
                              : p.amount.weiAmount
                      ),
                  new BigNumber(0)
              )
            : isJettonTransfer
            ? new BigNumber(JettonEncoder.jettonTransferAmount.toString())
            : params.amount.weiAmount;

        if (estimation) {
            requiredBalance = requiredBalance.plus(estimation.fee.weiAmount);

            if (
                isJettonTransfer &&
                estimation.event?.actions
                    .filter(action => action.type === 'JettonTransfer')
                    .some(action => action.status !== 'ok')
            ) {
                throw new Error('Jetton transfer estimation failed');
            }
        }

        await assertBalanceEnough(this.api, requiredBalance, this.wallet.rawAddress);
        if (Array.isArray(params) && isStandardTonWallet(this.wallet)) {
            assertMessagesNumberSupported(params.length, this.wallet.version);
        }
    }
}
