import { TronEstimation } from '../../../entries/send';
import { AssetAmount } from '../../../entries/crypto/asset/asset-amount';
import { TronAsset } from '../../../entries/crypto/asset/tron-asset';

export interface ITronSender {
    send(
        to: string,
        assetAmount: AssetAmount<TronAsset>,
        estimation: TronEstimation
    ): Promise<void>;

    estimate(to: string, assetAmount: AssetAmount<TronAsset>): Promise<TronEstimation>;
}
