import { TronEstimation } from '../../../entries/send';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../../entries/crypto/asset/tron-asset';
import { TronWallet } from '../../../entries/tron/tron-wallet';
import { TronApi, TronResources } from '../../../tronApi';
import { TronTrc20Encoder } from '../encoder/tron-trc20-encoder';

export interface ITronSender {
    send(
        to: string,
        assetAmount: AssetAmount<TronAsset>,
        estimation: TronEstimation
    ): Promise<void>;

    estimate(to: string, assetAmount: AssetAmount<TronAsset>): Promise<TronEstimation>;
}

export abstract class BaseTronSender {
    protected abstract tronWallet: TronWallet;

    protected abstract tronApi: TronApi;

    protected abstract trc20Encoder: TronTrc20Encoder;

    protected async estimateTransferResources(
        to: string,
        assetAmount: AssetAmount<TronAsset>
    ): Promise<TronResources> {
        const resources = await this.tronApi.applyResourcesSafetyMargin(
            await this.tronApi.estimateResources(
                await this.trc20Encoder.encodeTransferEstimateRequest(to, assetAmount)
            )
        );

        const bandwidhAvailable = await this.tronApi.getAccountBandwidth(this.tronWallet.address);
        if (bandwidhAvailable > resources.bandwidth) {
            resources.bandwidth = 0;
        }

        return resources;
    }

    protected async checkBandwidthIsEnough(
        resourcesBandwidth: number,
        transactionRawDataHex: string
    ) {
        const bandwidthNeeded = this.tronApi.estimateBandwidth(transactionRawDataHex);
        if (resourcesBandwidth >= bandwidthNeeded) {
            return;
        } else {
            const availableBandwidth = await this.tronApi.getAccountBandwidth(
                this.tronWallet.address
            );

            if (availableBandwidth < bandwidthNeeded) {
                throw new Error('Conditions changed since estimation. Not enough bandwidth');
            }
        }
    }
}
