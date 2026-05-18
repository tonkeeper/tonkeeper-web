/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { Address } from '@ton/core';
import { TON_ASSET, TON_USDT_ASSET } from '../../entries/crypto/asset/constants';
import { tonAssetAddressToString } from '../../entries/crypto/asset/ton-asset';
import {
    findSwapAssetByDeeplinkToken,
    normalizeSwapDeeplinkToken,
    parseBatteryDeeplink,
    parseBrowserDeeplink,
    parseBuyTonDeeplink,
    parsePoolDeeplink,
    parseSwapDeeplink
} from '../deeplinkingService';

describe('parseSwapDeeplink', () => {
    it('parses TON to UTYA web swap deeplink', () => {
        expect(parseSwapDeeplink('https://app.tonkeeper.com/swap?ft=TON&tt=UTYA')).toEqual({
            fromToken: 'TON',
            toToken: 'UTYA'
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

    it('ignores a trailing slash added by custom protocol handlers', () => {
        expect(parseSwapDeeplink('tonkeeper://swap/?ft=TON&tt=USDT')).toEqual({
            fromToken: 'TON',
            toToken: 'USDT'
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
        expect(
            normalizeSwapDeeplinkToken(tonAssetAddressToString(TON_USDT_ASSET.address))
        ).not.toBe(normalizeSwapDeeplinkToken(bounceableAddress));

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

describe('parsePoolDeeplink', () => {
    it('parses web pool deeplink', () => {
        expect(
            parsePoolDeeplink(
                'https://app.tonkeeper.com/pool/0:a45b17f28409229b78360e3290420f13e4fe20f90d7e2bf8c4ac6703259e22fa'
            )
        ).toEqual({
            poolAddress: '0:a45b17f28409229b78360e3290420f13e4fe20f90d7e2bf8c4ac6703259e22fa'
        });
    });

    it('parses app scheme pool deeplink', () => {
        expect(
            parsePoolDeeplink(
                'tonkeeper://pool/0:a45b17f28409229b78360e3290420f13e4fe20f90d7e2bf8c4ac6703259e22fa'
            )
        ).toEqual({
            poolAddress: '0:a45b17f28409229b78360e3290420f13e4fe20f90d7e2bf8c4ac6703259e22fa'
        });
    });

    it('ignores a trailing slash added by custom protocol handlers', () => {
        expect(
            parsePoolDeeplink(
                'tonkeeper://pool/0:a45b17f28409229b78360e3290420f13e4fe20f90d7e2bf8c4ac6703259e22fa/'
            )
        ).toEqual({
            poolAddress: '0:a45b17f28409229b78360e3290420f13e4fe20f90d7e2bf8c4ac6703259e22fa'
        });
    });

    it('returns null without pool address', () => {
        expect(parsePoolDeeplink('https://app.tonkeeper.com/pool')).toBeNull();
    });

    it('returns null for non-pool links', () => {
        expect(parsePoolDeeplink('https://app.tonkeeper.com/swap?ft=TON')).toBeNull();
    });
});

describe('parseBuyTonDeeplink', () => {
    it('parses web buy-ton deeplink', () => {
        expect(parseBuyTonDeeplink('https://app.tonkeeper.com/buy-ton')).toBe(true);
    });

    it('parses app scheme buy-ton deeplink', () => {
        expect(parseBuyTonDeeplink('tonkeeper://buy-ton')).toBe(true);
    });

    it('ignores a trailing slash added by custom protocol handlers', () => {
        expect(parseBuyTonDeeplink('tonkeeper://buy-ton/')).toBe(true);
    });

    it('returns null for non-buy-ton links', () => {
        expect(parseBuyTonDeeplink('https://app.tonkeeper.com/swap')).toBeNull();
    });
});

describe('parseBatteryDeeplink', () => {
    it('parses web battery deeplink', () => {
        expect(parseBatteryDeeplink('https://app.tonkeeper.com/battery')).toBe(true);
    });

    it('parses app scheme battery deeplink', () => {
        expect(parseBatteryDeeplink('tonkeeper://battery')).toBe(true);
    });

    it('ignores a trailing slash added by custom protocol handlers', () => {
        expect(parseBatteryDeeplink('tonkeeper://battery/')).toBe(true);
    });

    it('returns null for non-battery links', () => {
        expect(parseBatteryDeeplink('https://app.tonkeeper.com/swap')).toBeNull();
    });
});

describe('parseBrowserDeeplink', () => {
    it('parses web browser deeplink', () => {
        expect(parseBrowserDeeplink('https://app.tonkeeper.com/browser')).toEqual({});
    });

    it('parses app scheme browser deeplink', () => {
        expect(parseBrowserDeeplink('tonkeeper://browser')).toEqual({});
    });

    // items in browser are external links, we can't open them in the app
    it('matches regardless of extra path segments or query params', () => {
        expect(parseBrowserDeeplink('https://app.tonkeeper.com/browser/anything')).toEqual({});
        expect(parseBrowserDeeplink('tonkeeper://browser?url=https%3A%2F%2Fgetgems.io')).toEqual(
            {}
        );
    });

    it('returns null for non-browser links', () => {
        expect(parseBrowserDeeplink('https://app.tonkeeper.com/swap')).toBeNull();
    });
});
