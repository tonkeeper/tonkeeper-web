/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { chainSupportsComment, parseTransferAsset } from '../multichainTransferService';

const meta = { symbol: 'X', name: 'Token X', decimals: 6 };

describe('parseTransferAsset', () => {
    it('parses a native coin', () => {
        const asset = parseTransferAsset('eth/mainnet/coin', {
            ...meta,
            symbol: 'ETH',
            decimals: 18
        });
        expect(asset).toMatchObject({ network: 'eth', isNative: true, contract: undefined });
    });

    it('parses an ERC20 token with its contract', () => {
        const asset = parseTransferAsset('eth/mainnet/erc20/0xdead', meta);
        expect(asset).toMatchObject({
            network: 'eth',
            isNative: false,
            tokenType: 'erc20',
            contract: '0xdead'
        });
    });

    it('parses a TON jetton', () => {
        const asset = parseTransferAsset('ton/mainnet/jetton/EQabc', meta);
        expect(asset).toMatchObject({ network: 'ton', isNative: false, tokenType: 'jetton' });
    });

    it('parses a TRON TRC20 token', () => {
        const asset = parseTransferAsset('tron/mainnet/trc20/Tabc', meta);
        expect(asset).toMatchObject({ network: 'tron', isNative: false, tokenType: 'trc20' });
    });

    it('returns undefined for networks this chain-kit build cannot transact on', () => {
        expect(parseTransferAsset('polygon/mainnet/coin', meta)).toBeUndefined();
        expect(parseTransferAsset('sol/mainnet/coin', meta)).toBeUndefined();
    });
});

describe('chainSupportsComment', () => {
    it('is true only for TON', () => {
        expect(chainSupportsComment('ton')).toBe(true);
        expect(chainSupportsComment('eth')).toBe(false);
        expect(chainSupportsComment('btc')).toBe(false);
        expect(chainSupportsComment('tron')).toBe(false);
    });
});
