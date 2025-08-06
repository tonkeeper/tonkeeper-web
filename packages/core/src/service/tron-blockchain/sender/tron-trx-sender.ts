import { TronApi, TronResources } from '../../../tronApi';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../../entries/crypto/asset/tron-asset';
import { TronSigner } from '../../../entries/signer';
import { TronWallet } from '../../../entries/tron/tron-wallet';
import { TronEstimation } from '../../../entries/send';
import { ITronSender } from './I-tron-sender';

import { TronTrc20Encoder } from '../encoder/tron-trc20-encoder';
import { TRON_TRX_ASSET } from '../../../entries/crypto/asset/constants';
import { TransactionFeeTronAsset } from '../../../entries/crypto/transaction-fee';
import { TronNotEnoughBalanceEstimationError } from '../../../errors/TronNotEnoughBalanceEstimationError';

export class TronTrxSender implements ITronSender {
    private trc20Encoder: TronTrc20Encoder;

    constructor(
        private tronApi: TronApi,
        private walletInfo: TronWallet,
        private tronSigner: TronSigner
    ) {
        this.trc20Encoder = new TronTrc20Encoder({
            walletAddress: this.walletInfo.address,
            tronGridBaseUrl: this.tronApi.tronGridBaseUrl
        });
    }

    async send(to: string, assetAmount: AssetAmount<TronAsset>, estimation: TronEstimation) {
        const extra = await this.getBurnTrxAmountForResources(estimation.resources);
        await this.checkBalanceIsEnough(extra);

        const signedTx = await this.tronSigner(
            await this.trc20Encoder.encodeTransferTransaction(to, assetAmount)
        );

        await this.tronApi.broadcastSignedTransaction(signedTx);
    }

    async estimate(
        to: string,
        assetAmount: AssetAmount<TronAsset>
    ): Promise<{
        fee: TransactionFeeTronAsset;
        resources: TronResources;
    }> {
        const resources = await this.tronApi.applyResourcesSafetyMargin(
            await this.tronApi.estimateResources(
                await this.trc20Encoder.encodeTransferEstimateRequest(to, assetAmount)
            )
        );

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

    private async getBurnTrxAmountForResources(resources: TronResources) {
        const resourcesTrxPrice = await this.tronApi.getResourcePrices();
        const burnTrxForEnergy = resourcesTrxPrice.energy.weiAmount.multipliedBy(resources.energy);
        const burnTrxForBandwidth = resourcesTrxPrice.bandwidth.weiAmount.multipliedBy(
            resources.bandwidth
        );

        return new AssetAmount<TronAsset>({
            weiAmount: burnTrxForEnergy.plus(burnTrxForBandwidth),
            asset: TRON_TRX_ASSET
        });
    }

    private async checkBalanceIsEnough(
        trxRequired: AssetAmount<TronAsset>,
        fee?: TransactionFeeTronAsset
    ) {
        const balance = await this.tronApi.getBalances(this.walletInfo.address);
        if (trxRequired.weiAmount.gt(balance.trx)) {
            throw new TronNotEnoughBalanceEstimationError('Not enough balance', fee);
        }
    }
}
