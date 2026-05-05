/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { Address } from '@ton/core';
import { TON_ASSET, TON_USDT_ASSET } from '../../entries/crypto/asset/constants';
import { tonAssetAddressToString } from '../../entries/crypto/asset/ton-asset';
import {
    findSwapAssetByDeeplinkToken,
    normalizeSwapDeeplinkToken,
    parseSwapDeeplink
} from '../deeplinkingService';

describe('parseSwapDeeplink', () => {
    it('parses TON to UTYA web swap deeplink', () => {
        expect(parseSwapDeeplink('https://app.tonkeeper.com/swap?ft=TON&tt=UTYA')).toEqual({
            fromToken: 'TON',
            toToken: 'UTYA'
        });
    });

    it('parses TON to DOGS web swap deeplink', () => {
        expect(parseSwapDeeplink('https://app.tonkeeper.com/swap?ft=TON&tt=DOGS')).toEqual({
            fromToken: 'TON',
            toToken: 'DOGS'
        });
    });

    it('parses USDT to TON web swap deeplink', () => {
        expect(parseSwapDeeplink('https://app.tonkeeper.com/swap?ft=USDT&tt=TON')).toEqual({
            fromToken: 'USDT',
            toToken: 'TON'
        });
    });

    it('does not require a specific host for web swap links', () => {
        expect(parseSwapDeeplink('https://example.com/swap?ft=TON&tt=USDT')).toEqual({
            fromToken: 'TON',
            toToken: 'USDT'
        });
    });

    it('parses app scheme swap links using the same path rules as other deeplinks', () => {
        expect(parseSwapDeeplink('tonkeeper://swap?ft=TON&tt=USDT')).toEqual({
            fromToken: 'TON',
            toToken: 'USDT'
        });
    });

    it('supports links with only one token side', () => {
        expect(parseSwapDeeplink('https://app.tonkeeper.com/swap?ft=TON')).toEqual({
            fromToken: 'TON',
            toToken: undefined
        });
        expect(parseSwapDeeplink('https://app.tonkeeper.com/swap?tt=USDT')).toEqual({
            fromToken: undefined,
            toToken: 'USDT'
        });
    });

    it('returns null for non-swap links', () => {
        expect(parseSwapDeeplink('https://app.tonkeeper.com/transfer?ft=TON&tt=USDT')).toBeNull();
        expect(parseSwapDeeplink('tonkeeper://transfer?ft=TON&tt=USDT')).toBeNull();
    });

    it('parses swap links without token params', () => {
        expect(parseSwapDeeplink('https://app.tonkeeper.com/swap')).toEqual({
            fromToken: undefined,
            toToken: undefined
        });
    });

    it('returns null for malformed urls', () => {
        expect(parseSwapDeeplink('not a url')).toBeNull();
    });
});

describe('normalizeSwapDeeplinkToken', () => {
    it('replaces the Mongolian T\u00f6gr\u00f6g sign (\u20ae) used in USDt symbols with T', () => {
        expect(normalizeSwapDeeplinkToken('USD\u20ae')).toBe('USDT');
    });

    it('uppercases lowercase input', () => {
        expect(normalizeSwapDeeplinkToken('ton')).toBe('TON');
    });

    it('trims leading and trailing whitespace', () => {
        expect(normalizeSwapDeeplinkToken('  TON  ')).toBe('TON');
    });

    it('trims and uppercases together', () => {
        expect(normalizeSwapDeeplinkToken(' usdt ')).toBe('USDT');
    });

    it('returns empty string unchanged', () => {
        expect(normalizeSwapDeeplinkToken('')).toBe('');
    });

    it('leaves already-normalized values unchanged', () => {
        expect(normalizeSwapDeeplinkToken('USDT')).toBe('USDT');
    });
});

describe('findSwapAssetByDeeplinkToken', () => {
    it('matches USDT deeplink token to the TON USDt asset symbol', () => {
        expect(findSwapAssetByDeeplinkToken([TON_USDT_ASSET], 'USDT')).toBe(TON_USDT_ASSET);
    });

    it('matches tokens by symbol case-insensitively', () => {
        expect(findSwapAssetByDeeplinkToken([TON_ASSET], ' ton ')).toBe(TON_ASSET);
    });

    it('matches tokens by raw address', () => {
        expect(
            findSwapAssetByDeeplinkToken(
                [TON_USDT_ASSET],
                tonAssetAddressToString(TON_USDT_ASSET.address)
            )
        ).toBe(TON_USDT_ASSET);
    });

    it('matches tokens by friendly (bounceable) address even though the asset stores a raw address', () => {
        const bounceableAddress = (TON_USDT_ASSET.address as Address).toString({
            bounceable: true
        });

        // normalizeSwapDeeplinkToken on raw vs friendly gives different uppercase strings —
        // the removed string-comparison branch would have silently missed this case
        expect(normalizeSwapDeeplinkToken(tonAssetAddressToString(TON_USDT_ASSET.address))).not.toBe(
            normalizeSwapDeeplinkToken(bounceableAddress)
        );

        // Address.equals handles both representations correctly
        expect(findSwapAssetByDeeplinkToken([TON_USDT_ASSET], bounceableAddress)).toBe(
            TON_USDT_ASSET
        );
    });

    it('returns undefined for unknown symbols', () => {
        expect(
            findSwapAssetByDeeplinkToken([TON_ASSET, TON_USDT_ASSET], 'UNKNOWN')
        ).toBeUndefined();
    });

    it('returns undefined for malformed addresses', () => {
        expect(
            findSwapAssetByDeeplinkToken([TON_ASSET, TON_USDT_ASSET], 'not-a-token-address')
        ).toBeUndefined();
    });
});
