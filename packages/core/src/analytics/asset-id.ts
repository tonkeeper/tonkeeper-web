import { Address } from '@ton/core';
import { Asset, isTonAsset } from '../entries/crypto/asset/asset';
import { isTon } from '../entries/crypto/asset/ton-asset';
import { Network } from '../entries/network';
import { toAnalyticsChainCode } from './asset-chain';
import { AssetSchema } from './generated/models/AssetSchema';

/**
 * Analytics Asset ID — `{chain}/{network}/{type}[/{address}]`, the identifier
 * the analytics backend joins asset-level events on. Specified in
 * `docs/ASSET_ID.md` in tonkeeper/analytics-schemas.
 */
export type AnalyticsAssetId = AssetSchema;

const networkSegment = (network: Network) => (network === Network.TESTNET ? 'testnet' : 'mainnet');

export const tonCoinAssetId = (network: Network): AnalyticsAssetId =>
    `ton/${networkSegment(network)}/coin`;

/**
 * A chain's own coin, from the app's network code for that chain — the code and
 * the Asset ID chain segment are not always spelled the same.
 */
export const nativeCoinAssetId = (chain: string, network: Network): AnalyticsAssetId =>
    `${toAnalyticsChainCode(chain)}/${networkSegment(network)}/coin`;

/**
 * Raw, not user-friendly. Producers disagree — the trading and swaps backends
 * key TON assets by the raw address, the multichain balances backend documents
 * the friendly one, and the spec's examples show friendly — but the native
 * clients emit raw, and analytics only joins across platforms if we match them.
 */
export const tonJettonAssetId = (address: Address, network: Network): AnalyticsAssetId =>
    `ton/${networkSegment(network)}/jetton/${address.toRawString()}`;

export const tonNftAssetId = (address: string, network: Network): AnalyticsAssetId =>
    `ton/${networkSegment(network)}/nft/${Address.parse(address).toRawString()}`;

/**
 * Extra currencies have no type in the Asset ID spec. `extra` keeps them
 * distinguishable from jettons instead of silently folding them into one of the
 * defined types.
 */
export const tonExtraCurrencyAssetId = (id: string, network: Network): AnalyticsAssetId =>
    `ton/${networkSegment(network)}/extra/${id}`;

export const toAnalyticsAssetId = (asset: Asset, network: Network): AnalyticsAssetId => {
    if (isTonAsset(asset)) {
        if (isTon(asset.address)) {
            return tonCoinAssetId(network);
        }

        if (typeof asset.address !== 'string') {
            return tonJettonAssetId(asset.address, network);
        }

        return tonExtraCurrencyAssetId(asset.address, network);
    }

    if (asset.address === 'TRX') {
        return `tron/${networkSegment(network)}/coin`;
    }

    return `tron/${networkSegment(network)}/trc20/${asset.address}`;
};

/** Chain segment of an Asset ID — `wallet_interface` and `fee_asset` are per-chain. */
export const assetIdChain = (assetId: AnalyticsAssetId): string => assetId.split('/')[0];

/**
 * Restates an Asset ID minted by a backend in the form analytics joins on, so
 * the same asset reported from a balances-backed screen and from a trading-backed
 * one lands on one identifier: the chain segment in the analytics spelling, and
 * — for TON, the only chain with two address forms — the raw address.
 * Anything unparseable is passed through untouched.
 */
export const normalizeAnalyticsAssetId = (assetId: string): AnalyticsAssetId => {
    const [chain, ...rest] = assetId.split('/');
    const segments = [toAnalyticsChainCode(chain), ...rest];

    if (chain === 'ton' && segments[3]) {
        try {
            segments[3] = Address.parse(segments[3]).toRawString();
        } catch {
            // Not an address this client can parse — keep the producer's spelling.
        }
    }

    return segments.join('/') as AnalyticsAssetId;
};
