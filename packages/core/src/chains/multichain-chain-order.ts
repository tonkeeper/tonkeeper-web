import { ChainId } from './types';

/**
 * Canonical network display order for every multichain surface.
 *
 * This mirrors the native apps' model-level order. A flow may expose only a
 * subset of these networks, but it must retain their relative positions.
 */
export const MULTICHAIN_CHAIN_DISPLAY_ORDER = [
    'ton',
    'tron',
    'eth',
    'btc',
    'base',
    'bsc',
    'arb'
] as const;

export type MultichainChainCode = (typeof MULTICHAIN_CHAIN_DISPLAY_ORDER)[number];

/**
 * Deduplicates and orders a flow-specific chain subset. Unknown backend
 * networks trail the known ones in their original order so newly introduced
 * chains remain usable until they are added to the canonical list.
 */
export function orderMultichainChains<T extends string>(chains: readonly T[]): T[] {
    const remaining = new Set<string>(chains);
    return [
        ...MULTICHAIN_CHAIN_DISPLAY_ORDER.filter(chain => remaining.delete(chain)),
        ...remaining
    ] as T[];
}

/**
 * Backend networks a wallet chain's address is valid on. One EVM address
 * serves every EVM network; Solana has no send path in this build.
 */
export const MULTICHAIN_NETWORKS_BY_CHAIN: Record<ChainId, readonly MultichainChainCode[]> = {
    ton: ['ton'],
    evm: ['eth', 'base', 'arb', 'bsc'],
    btc: ['btc'],
    tron: ['tron'],
    sol: []
};

/** Every network the given wallet chains cover, in display order. */
export function networksOfChains(chains: readonly ChainId[]): MultichainChainCode[] {
    return orderMultichainChains(chains.flatMap(chain => MULTICHAIN_NETWORKS_BY_CHAIN[chain]));
}
