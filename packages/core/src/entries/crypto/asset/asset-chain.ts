import { ChainId } from '../../../chains/types';
import { Asset, isTonAsset, isTronAsset } from './asset';
import { TON_ASSET } from './constants';
import { TRON_TRX_ASSET } from './constants';

/**
 * Map an `Asset` to the `ChainId` it lives on. Used by the multichain
 * portfolio row to render the chain badge overlay and chain chip.
 *
 * Today only `'ton'` and `'tron'` are reachable; EVM and BTC asset
 * shapes don't exist in `Asset` yet. Once they do the `else if`
 * branches drop in below the existing ones.
 */
export function getAssetChainId(asset: Asset): ChainId {
    if (isTonAsset(asset)) return 'ton';
    if (isTronAsset(asset)) return 'tron';
    // The `Asset` union has no third member today; the unreachable branch
    // remains for when EVM/BTC asset shapes land.
    throw new Error(`getAssetChainId: unsupported asset`);
}

/**
 * Whether `asset` is the native coin of its chain (TON, ETH, BTC, TRX).
 * Native coins do not get a chain badge or chain chip on the portfolio
 * row — only non-native tokens do. Matches the iOS/Android pattern.
 */
export function isNativeCoin(asset: Asset): boolean {
    if (asset.id === TON_ASSET.id) return true;
    if (asset.id === TRON_TRX_ASSET.id) return true;
    return false;
}
