/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import {
    MULTICHAIN_CHAIN_DISPLAY_ORDER,
    networksOfChains,
    orderMultichainChains
} from '../multichain-chain-order';

describe('multichain chain display order', () => {
    it('matches the native apps order', () => {
        expect(MULTICHAIN_CHAIN_DISPLAY_ORDER).toEqual([
            'ton',
            'tron',
            'eth',
            'btc',
            'base',
            'bsc',
            'arb'
        ]);
    });

    it('orders and deduplicates subsets while trailing unknown chains', () => {
        expect(orderMultichainChains(['arb', 'unknown', 'eth', 'ton', 'tron', 'eth'])).toEqual([
            'ton',
            'tron',
            'eth',
            'arb',
            'unknown'
        ]);
    });

    it('expands wallet chains to every network they cover, in display order', () => {
        expect(networksOfChains(['btc', 'evm', 'ton'])).toEqual([
            'ton',
            'eth',
            'btc',
            'base',
            'bsc',
            'arb'
        ]);
        expect(networksOfChains(['sol'])).toEqual([]);
    });
});
