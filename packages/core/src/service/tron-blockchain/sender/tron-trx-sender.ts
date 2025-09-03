import { TronApi, TronResources } from '../../../tronApi';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../../entries/crypto/asset/tron-asset';
import { TronSigner } from '../../../entries/signer';
import { TronWallet } from '../../../entries/tron/tron-wallet';
import { TronEstimation } from '../../../entries/send';
import { BaseTronSender, ITronSender } from './I-tron-sender';

import { TronTrc20Encoder } from '../encoder/tron-trc20-encoder';
import { TRON_TRX_ASSET } from '../../../entries/crypto/asset/constants';
import { TransactionFeeTronAsset } from '../../../entries/crypto/transaction-fee';
import { TronNotEnoughBalanceEstimationError } from '../../../errors/TronNotEnoughBalanceEstimationError';

export class TronTrxSender extends BaseTronSender implements ITronSender {
    protected trc20Encoder: TronTrc20Encoder;

    public static async getBurnTrxAmountForResources(tronApi: TronApi, resources: TronResources) {
        const resourcesTrxPrice = await tronApi.getResourcePrices();
        const burnTrxForEnergy = resourcesTrxPrice.energy.weiAmount.multipliedBy(resources.energy);
        const burnTrxForBandwidth = resourcesTrxPrice.bandwidth.weiAmount.multipliedBy(
            resources.bandwidth
        );

        return new AssetAmount<TronAsset>({
            weiAmount: burnTrxForEnergy.plus(burnTrxForBandwidth),
            asset: TRON_TRX_ASSET
        });
    }

    constructor(
        protected tronApi: TronApi,
        protected tronWallet: TronWallet,
        private tronSigner: TronSigner
    ) {
        super();
        this.trc20Encoder = new TronTrc20Encoder({
            walletAddress: this.tronWallet.address,
            tronGridBaseUrl: this.tronApi.tronGridBaseUrl
        });
    }

    async send(to: string, assetAmount: AssetAmount<TronAsset>, estimation: TronEstimation) {
        const extra = await this.getBurnTrxAmountForResources(estimation.resources);
        await this.checkBalanceIsEnough(extra);

        const signedTx = await this.tronSigner(
            await this.trc20Encoder.encodeTransferTransaction(to, assetAmount)
        );

        await this.checkBandwidthIsEnough(estimation.resources.bandwidth, signedTx.raw_data_hex);

        await this.tronApi.broadcastSignedTransaction(signedTx);
    }

    async estimate(
        to: string,
        assetAmount: AssetAmount<TronAsset>
    ): Promise<{
        fee: TransactionFeeTronAsset;
        resources: TronResources;
    }> {
        const resources = await this.estimateTransferResources(to, assetAmount);

        const extra = await this.getBurnTrxAmountForResources(resources);
        const fee = {
            type: 'tron-asset' as const,
            extra
        };
        await this.checkBalanceIsEnough(extra, fee);

        return {
            fee,
            resources
        };
    }

    public async getBurnTrxAmountForResources(resources: TronResources) {
        return TronTrxSender.getBurnTrxAmountForResources(this.tronApi, resources);
    }

    private async checkBalanceIsEnough(
        trxRequired: AssetAmount<TronAsset>,
        fee?: TransactionFeeTronAsset
    ) {
        const balance = await this.tronApi.getBalances(this.tronWallet.address);
        if (trxRequired.weiAmount.gt(balance.trx)) {
            throw new TronNotEnoughBalanceEstimationError('Not enough balance', fee);
        }
    }
}
