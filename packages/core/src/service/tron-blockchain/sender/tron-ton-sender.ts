import { TronApi, TronResources } from '../../../tronApi';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../../entries/crypto/asset/tron-asset';
import { MultiTransactionsSigner } from '../../../entries/signer';
import { TronWallet } from '../../../entries/tron/tron-wallet';
import { TronEstimation } from '../../../entries/send';
import { errorMessage } from '../../../utils/types';
import { NotEnoughBatteryBalanceError } from '../../../errors/NotEnoughBatteryBalanceError';
import { ITronSender } from './I-tron-sender';
import {
    Configuration as BatteryConfiguration,
    DefaultApi as BatteryApi
} from '../../../batteryApi';
import { TronTrc20Encoder } from '../encoder/tron-trc20-encoder';
import { TON_ASSET } from '../../../entries/crypto/asset/constants';
import { TonEncoder } from '../../ton-blockchain/encoder/ton-encoder';
import { APIConfig } from '../../../entries/apis';
import { TransactionFeeTonAssetRelayed } from '../../../entries/crypto/transaction-fee';
import { WalletMessageSender } from '../../ton-blockchain/sender';
import { TonWalletStandard } from '../../../entries/wallet';
import { Cell } from '@ton/core';
import type { SignedTransaction, Transaction } from 'tronweb/src/types/Transaction';
import { AccountsApi } from '../../../tonApiV2';
import { TronNotEnoughBalanceEstimationError } from '../../../errors/TronNotEnoughBalanceEstimationError';
import { TonAsset } from '../../../entries/crypto/asset/ton-asset';

export class TronTonSender implements ITronSender {
    public static identifyingComment = 'Tron gas fee';

    private batteryApi: BatteryApi;

    private trc20Encoder: TronTrc20Encoder;

    private tonTransferOwnFee = AssetAmount.fromRelativeAmount({
        amount: 0.01,
        asset: TON_ASSET
    });

    constructor(
        private tronApi: TronApi,
        private tonApi: APIConfig,
        batteryConfig: BatteryConfiguration,
        private tronWalletInfo: TronWallet,
        private tonWalletInfo: TonWalletStandard,
        private multiTransactionsSigner: MultiTransactionsSigner
    ) {
        this.batteryApi = new BatteryApi(batteryConfig);
        this.trc20Encoder = new TronTrc20Encoder({
            walletAddress: this.tronWalletInfo.address,
            tronGridBaseUrl: this.tronApi.tronGridBaseUrl
        });
    }

    async send(to: string, assetAmount: AssetAmount<TronAsset>, estimation: TronEstimation) {
        if (estimation.fee.type !== 'ton-asset-relayed') {
            throw new Error('Unacceptable fee type');
        }

        await this.checkBalanceIsEnough(estimation.fee.extra);

        const fee = estimation.fee as TransactionFeeTonAssetRelayed;
        const tronTxToSign = await this.trc20Encoder.encodeTransferTransaction(to, assetAmount);
        const tonTransferToSign = await new TonEncoder(this.tonApi).encodeTransfer({
            to: fee.sendToAddress,
            weiAmount: fee.extra.weiAmount,
            payload: {
                type: 'comment',
                value: TronTonSender.identifyingComment
            }
        });

        let signedTronTx: (Transaction & SignedTransaction) | undefined;
        const tonSigner = async (cell: Cell) => {
            const signed = await this.multiTransactionsSigner([tronTxToSign, cell]);
            signedTronTx = signed[0] as Transaction & SignedTransaction;
            return signed[1] as Buffer;
        };
        tonSigner.type = 'cell' as const;

        const signedTonTx = await new WalletMessageSender(
            this.tonApi,
            this.tonWalletInfo,
            tonSigner
        ).toExternal(tonTransferToSign);

        if (!signedTronTx) {
            throw new Error('Tron transaction is not signed');
        }

        try {
            await this.batteryApi.tronSend({
                tronSendRequest: {
                    tx: Buffer.from(JSON.stringify(signedTronTx!)).toString('base64'),
                    wallet: this.tronWalletInfo.address,
                    energy: estimation.resources.energy,
                    bandwidth: estimation.resources.bandwidth,
                    instantFeeTx: signedTonTx!.toBoc().toString('base64')
                },
                userPublicKey: Buffer.from(this.tonWalletInfo.publicKey, 'hex').toString('base64')
            });
        } catch (e) {
            if (e && typeof e === 'object' && 'response' in e && e.response instanceof Response) {
                const message = await e.response.text();
                if (message.includes('Not enough balance')) {
                    throw new NotEnoughBatteryBalanceError(errorMessage(e)!);
                }
            }

            throw e;
        }
    }

    async estimate(
        to: string,
        assetAmount: AssetAmount<TronAsset>
    ): Promise<{
        fee: TransactionFeeTonAssetRelayed;
        resources: TronResources;
    }> {
        const resources = await this.tronApi.applyResourcesSafetyMargin(
            await this.tronApi.estimateResources(
                await this.trc20Encoder.encodeTransferEstimateRequest(to, assetAmount)
            )
        );

        /* const bandwidhAvailable = await this.tronApi.getAccountBandwidth(this.walletInfo.address);
        resources.bandwidth = Math.max(0, resources.bandwidth - bandwidhAvailable);*/

        const estimation = await this.batteryApi.tronEstimate({
            wallet: this.tronWalletInfo.address,
            ...resources
        });

        const tonInstantFee = estimation.instantFee.acceptedAssets.find(a => a.type === 'ton');
        if (!tonInstantFee) {
            throw new Error('Instant fee for ton not allowed');
        }

        const extra = new AssetAmount({
            weiAmount: tonInstantFee.amountNano,
            asset: TON_ASSET
        });

        const fee = {
            type: 'ton-asset-relayed' as const,
            extra,
            sendToAddress: estimation.instantFee.feeAddress
        };

        await this.checkBalanceIsEnough(extra, fee);

        return {
            fee,
            resources
        };
    }

    private async checkBalanceIsEnough(
        extra: AssetAmount<TonAsset>,
        fee?: TransactionFeeTonAssetRelayed
    ) {
        const account = await new AccountsApi(this.tonApi.tonApiV2).getAccount({
            accountId: this.tonWalletInfo.rawAddress
        });

        const requiredTonBalance = new AssetAmount({
            weiAmount: extra.weiAmount.plus(this.tonTransferOwnFee.weiAmount),
            asset: TON_ASSET
        });

        if (requiredTonBalance.weiAmount.isGreaterThan(account.balance)) {
            throw new TronNotEnoughBalanceEstimationError(
                `Not enough balance to pay instant fee in ton. Required: ${requiredTonBalance.stringAssetRelativeAmount}`,
                fee
            );
        }
    }
}
