import { BLOCKCHAIN_NAME } from '../../crypto';
import { TonAsset } from './ton-asset';
import { TronAsset } from './tron-asset';

export type Asset = TonAsset | TronAsset;

export function isTonAsset(asset: Asset): asset is TonAsset {
    return asset.blockchain === BLOCKCHAIN_NAME.TON;
}

export function isTronAsset(asset: Asset): asset is TronAsset {
    return asset.blockchain === BLOCKCHAIN_NAME.TRON;
}
