import { APIConfig } from '../../entries/apis';
import { BatteryMessageSender, GaslessMessageSender, Sender } from './sender';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { isTon, TonAsset } from '../../entries/crypto/asset/ton-asset';
import { TON_ASSET } from '../../entries/crypto/asset/constants';
import { LedgerMessageSender } from './sender/ledger-message-sender';
import { TonEncoder } from './encoder/ton-encoder';
import { JettonEncoder } from './encoder/jetton-encoder';
import BigNumber from 'bignumber.js';
import { assertBalanceEnough } from './utils';
import { getTonEstimationTonFee, TonEstimation } from '../../entries/send';
import { isStandardTonWallet, TonContract } from '../../entries/wallet';
import { MessagePayloadParam } from './encoder/types';
import { assertMessagesNumberSupported } from './utils';
import { seeIfValidTonAddress } from '../../utils/common';
import { ExtraCurrencyEncoder } from './encoder/extra-currency-encoder';

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
        if (this.isExtraCurrency(params)) {
            return this.estimateExtraCurrency(sender, params);
        }
        if (this.isJettonTransfer(params)) {
            return this.estimateJetton(sender, params);
        } else {
            return this.estimateTon(sender, params);
        }
    }

    private async estimateExtraCurrency(
        sender: Sender,
        params: TransferParams
    ): Promise<TonEstimation> {
        // await this.checkTransferPossibility(sender, params); // TODO: Extra Currency validation

        if (Array.isArray(params)) {
            if (sender instanceof LedgerMessageSender) {
                throw new Error('Ledger multisend is not supported.');
            } else {
                return sender.estimate(
                    await new ExtraCurrencyEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                        params.map(p => ({
                            ...p,
                            weiAmount: p.amount.weiAmount,
                            id: Number(p.amount.asset.id)
                        }))
                    )
                );
            }
        } else {
            if (sender instanceof LedgerMessageSender) {
                throw new Error('Ledger extra currency transfer is not supported.'); // TODO: Extra Currency - check ledger
            } else {
                return sender.estimate(
                    await new ExtraCurrencyEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                        {
                            ...params,
                            weiAmount: params.amount.weiAmount,
                            id: Number(params.amount.asset.id)
                        }
                    )
                );
            }
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
                    await new JettonEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                        this.patchResponseAddress(sender, params)
                    )
                );
            }
        } else {
            if (sender instanceof LedgerMessageSender) {
                return (await sender.jettonTransfer(params)).estimate();
            } else {
                return sender.estimate(
                    await new JettonEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                        this.patchResponseAddress(sender, params)
                    )
                );
            }
        }
    }

    async send(sender: Sender, estimation: TonEstimation, params: TransferParams) {
        if (this.isExtraCurrency(params)) {
            return this.sendExtraCurrency(sender, estimation, params);
        }
        if (this.isJettonTransfer(params)) {
            await this.sendJetton(sender, estimation, params);
        } else {
            await this.sendTon(sender, estimation, params);
        }
    }

    private async sendExtraCurrency(
        sender: Sender,
        estimation: TonEstimation,
        params: TransferParams
    ) {
        // await this.checkTransferPossibility(sender, params, estimation); // TODO: Extra Currency validation

        if (Array.isArray(params)) {
            if (sender instanceof LedgerMessageSender) {
                throw new Error('Ledger multisend is not supported.');
            } else {
                return sender.send(
                    await new ExtraCurrencyEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                        params.map(p => ({
                            ...p,
                            weiAmount: p.amount.weiAmount,
                            id: Number(p.amount.asset.id)
                        }))
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
                    await new ExtraCurrencyEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                        {
                            ...params,
                            weiAmount: params.amount.weiAmount,
                            id: Number(params.amount.asset.id)
                        }
                    )
                );
            }
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
                    await new JettonEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                        this.patchResponseAddress(sender, params)
                    )
                );
            }
        } else {
            if (sender instanceof LedgerMessageSender) {
                return (await sender.jettonTransfer(params)).send();
            } else {
                return sender.send(
                    await new JettonEncoder(this.api, this.wallet.rawAddress).encodeTransfer(
                        this.patchResponseAddress(sender, params)
                    )
                );
            }
        }
    }

    private patchResponseAddress(
        sender: Exclude<Sender, LedgerMessageSender>,
        params: TransferParams
    ):
        | {
              to: string;
              amount: AssetAmount<TonAsset>;
              payload?: MessagePayloadParam;
              responseAddress?: string;
          }
        | {
              to: string;
              amount: AssetAmount<TonAsset>;
              payload?: MessagePayloadParam;
              responseAddress?: string;
          }[] {
        if (Array.isArray(params)) {
            return params.map(p => ({ ...p, responseAddress: sender.excessAddress }));
        }

        return {
            ...params,
            responseAddress: sender.excessAddress
        };
    }

    private isExtraCurrency(params: TransferParams) {
        const token = Array.isArray(params)
            ? params[0].amount.asset.address
            : params.amount.asset.address;

        return token !== TON_ASSET.address && !seeIfValidTonAddress(token.toString());
    }

    private isJettonTransfer(params: TransferParams) {
        return Array.isArray(params)
            ? params[0].amount.asset.id !== TON_ASSET.id
            : params.amount.asset.id !== TON_ASSET.id;
    }

    private getTransferAsset(params: TransferParams) {
        return Array.isArray(params) ? params[0].amount.asset : params.amount.asset;
    }

    // eslint-disable-next-line complexity
    private async checkTransferPossibility(
        sender: Sender,
        params: TransferParams,
        estimation?: TonEstimation
    ) {
        if (Array.isArray(params) && new Set(params.map(p => p.amount.asset.id)).size > 1) {
            throw new Error('Different assets transfers are not supported at the moment.');
        }

        const isNoGasSender =
            sender instanceof BatteryMessageSender || sender instanceof GaslessMessageSender;

        if (!Array.isArray(params) && params.isMax && isTon(params.amount.asset.address)) {
            return;
        }

        const isJettonTransfer = this.isJettonTransfer(params);

        let requiredTonBalance;
        let requiredJettonBalance;
        if (isJettonTransfer) {
            if (!isNoGasSender) {
                requiredTonBalance = Array.isArray(params)
                    ? new BigNumber(JettonEncoder.jettonTransferAmount.toString()).multipliedBy(
                          params.length
                      )
                    : new BigNumber(JettonEncoder.jettonTransferAmount.toString());
            }

            requiredJettonBalance = Array.isArray(params)
                ? params.reduce((acc, p) => acc.plus(p.amount.weiAmount), new BigNumber(0))
                : params.amount.weiAmount;
        } else {
            requiredTonBalance = Array.isArray(params)
                ? params.reduce((acc, p) => acc.plus(p.amount.weiAmount), new BigNumber(0))
                : params.amount.weiAmount;
        }

        if (estimation && estimation.fee.type === 'ton-asset') {
            if (isTon(estimation.fee.extra.asset.address) && !isNoGasSender) {
                requiredTonBalance = (requiredTonBalance || new BigNumber(0)).plus(
                    getTonEstimationTonFee(estimation)
                );
            } else if (estimation.fee.extra.asset.id === this.getTransferAsset(params).id) {
                requiredJettonBalance = (requiredJettonBalance || new BigNumber(0)).plus(
                    estimation.fee.extra.weiAmount
                );
            }

            if (
                isJettonTransfer &&
                estimation.event?.actions
                    .filter(action => action.type === 'JettonTransfer')
                    .some(action => action.status !== 'ok')
            ) {
                throw new Error('Jetton transfer estimation failed');
            }
        }

        if (requiredTonBalance) {
            await assertBalanceEnough(
                this.api,
                requiredTonBalance,
                TON_ASSET,
                this.wallet.rawAddress
            );
        }

        if (requiredJettonBalance) {
            await assertBalanceEnough(
                this.api,
                requiredJettonBalance,
                this.getTransferAsset(params),
                this.wallet.rawAddress
            );
        }

        if (Array.isArray(params) && isStandardTonWallet(this.wallet)) {
            assertMessagesNumberSupported(params.length, this.wallet.version);
        }
    }
}
