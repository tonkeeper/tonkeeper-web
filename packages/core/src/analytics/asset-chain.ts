import { AssetChainSchema } from './generated/models/AssetChainSchema';

/**
 * Canonical chain dimension for analytics — the first segment of an Asset ID,
 * and the `asset_chain` field on the dapp events.
 */
export type AnalyticsAssetChain = AssetChainSchema;

/**
 * The app's own network codes (`ChainKitNetwork`, the multichain backend's
 * `Chain`, the dApp catalog's per-app chain) mostly match the analytics
 * vocabulary one-to-one. BNB Chain is the exception: everything client-side
 * calls it `bsc`, analytics calls it `bnb`.
 */
const RENAMED_CHAINS: Record<string, AnalyticsAssetChain> = {
    bsc: 'bnb'
};

const ANALYTICS_CHAINS: AnalyticsAssetChain[] = [
    'ton',
    'eth',
    'base',
    'arb',
    'bnb',
    'pol',
    'sol',
    'tron',
    'btc',
    'ltc',
    'doge',
    'bch'
];

/**
 * The analytics spelling of a chain code, for the places that carry the code
 * itself rather than the `asset_chain` enum — the chain segment of an Asset ID.
 * Codes the analytics vocabulary doesn't name pass through unchanged: an Asset
 * ID minted by a backend newer than this client keeps its own chain rather than
 * being rewritten into something the backend never said.
 */
export const toAnalyticsChainCode = (chain: string): string => RENAMED_CHAINS[chain] ?? chain;

/**
 * Maps an app network code to the analytics chain vocabulary. Anything the
 * vocabulary doesn't name — a chain-agnostic entity, or a code from a backend
 * newer than this client — reports `multichain`, the value for an entity not
 * tied to a single chain.
 */
export const toAnalyticsAssetChain = (chain: string | undefined): AnalyticsAssetChain => {
    if (chain === undefined) {
        return 'multichain';
    }
    const renamed = RENAMED_CHAINS[chain];
    if (renamed !== undefined) {
        return renamed;
    }
    return ANALYTICS_CHAINS.find(known => known === chain) ?? 'multichain';
};

/**
 * The chain of an entity connected on several at once (a WalletConnect session,
 * a dApp serving multiple chains): one chain reports itself, anything else is
 * `multichain`.
 */
export const toAnalyticsAssetChains = (chains: string[]): AnalyticsAssetChain =>
    chains.length === 1 ? toAnalyticsAssetChain(chains[0]) : 'multichain';
