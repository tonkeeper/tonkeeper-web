/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { Address } from '@ton/core';
import { TON_ASSET, TON_USDT_ASSET } from '../../entries/crypto/asset/constants';
import { tonAssetAddressToString } from '../../entries/crypto/asset/ton-asset';
import {
    findSwapAssetByDeeplinkToken,
    normalizeSwapDeeplinkToken,
    parseAssetIdTransfer,
    parseAddWalletDeeplink,
    parseBackupDeeplink,
    parseBatteryDeeplink,
    parseBrowserDeeplink,
    parseBuyTonDeeplink,
    parseDappDeeplink,
    parseDepositDeeplink,
    parseEthereumTransferLink,
    parseMainDeeplink,
    parsePoolDeeplink,
    parseReceiveDeeplink,
    parseStakingDeeplink,
    parseSwapDeeplink,
    parseTradeAssetDeeplink,
    parseTradingDeeplink,
    parseWithdrawDeeplink,
    rewriteTonAssetIdToLegacyLink
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

describe('parseAssetIdTransfer', () => {
    it('parses a transfer link with a canonical asset id, keeping its casing intact', () => {
        const result = parseAssetIdTransfer(
            'tonkeeper://transfer/0xRecipientAbC?asset_id=eth/mainnet/erc20/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&amount=2500000&text=hi'
        );
        expect(result).toEqual({
            assetId: 'eth/mainnet/erc20/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            address: '0xRecipientAbC',
            amount: '2500000',
            text: 'hi'
        });
    });

    it('decodes a URL-encoded asset id', () => {
        const result = parseAssetIdTransfer(
            'https://app.tonkeeper.com/transfer/TXYZ?asset_id=tron%2Fmainnet%2Ftrc20%2FTR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
        );
        expect(result?.assetId).toBe('tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
        expect(result?.address).toBe('TXYZ');
    });

    it('returns null without an asset_id or with a malformed one', () => {
        expect(parseAssetIdTransfer('tonkeeper://transfer/UQAA?amount=1')).toBeNull();
        expect(parseAssetIdTransfer('tonkeeper://transfer/UQAA?asset_id=ethmainnet')).toBeNull();
    });

    it('returns null for non-transfer links', () => {
        expect(parseAssetIdTransfer('tonkeeper://swap?asset_id=eth/mainnet/coin')).toBeNull();
    });
});

describe('rewriteTonAssetIdToLegacyLink', () => {
    const JETTON = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';

    it('folds a TON jetton asset id into the legacy jetton param', () => {
        const result = rewriteTonAssetIdToLegacyLink(
            `tonkeeper://transfer/UQAA?amount=100&asset_id=ton/mainnet/jetton/${JETTON}`
        );
        expect(result).not.toBeNull();
        expect(result).not.toContain('asset_id');
        expect(decodeURIComponent(result!)).toContain(`jetton=${JETTON}`);
        expect(result).toContain('amount=100');
    });

    it('lets asset_id win over a conflicting jetton param', () => {
        const result = rewriteTonAssetIdToLegacyLink(
            `tonkeeper://transfer/UQAA?jetton=0:1111&asset_id=ton/mainnet/jetton/${JETTON}`
        );
        expect(decodeURIComponent(result!)).toContain(`jetton=${JETTON}`);
        expect(result).not.toContain('0:1111');
        expect(decodeURIComponent(result!)).not.toContain('0:1111');
    });

    it('drops the jetton param when the asset id names the native coin', () => {
        const result = rewriteTonAssetIdToLegacyLink(
            'tonkeeper://transfer/UQAA?jetton=0:1111&asset_id=ton/mainnet/coin'
        );
        expect(result).not.toBeNull();
        expect(result).not.toContain('asset_id');
        expect(result).not.toContain('jetton');
    });

    it('leaves non-TON asset ids alone', () => {
        expect(
            rewriteTonAssetIdToLegacyLink(
                'tonkeeper://transfer/0xAA?asset_id=eth/mainnet/erc20/0xBB'
            )
        ).toBeNull();
    });

    it('returns null for links without an asset id', () => {
        expect(rewriteTonAssetIdToLegacyLink('tonkeeper://transfer/UQAA?amount=1')).toBeNull();
    });
});

describe('parseEthereumTransferLink', () => {
    const RECIPIENT = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

    it('parses a native transfer with a chain id and an exponent amount', () => {
        expect(parseEthereumTransferLink(`ethereum:${RECIPIENT}@1?value=2.014e18`)).toEqual({
            address: RECIPIENT,
            assetId: 'eth/mainnet/coin',
            amount: '2014000000000000000'
        });
    });

    it('a native transfer without a chain id carries only the recipient', () => {
        expect(parseEthereumTransferLink(`ethereum:${RECIPIENT}`)).toEqual({
            address: RECIPIENT
        });
        // The amount would be denominated in whichever coin gets picked.
        expect(parseEthereumTransferLink(`ethereum:${RECIPIENT}?value=1e18`)).toEqual({
            address: RECIPIENT
        });
    });

    it('parses an ERC-20 transfer into a canonical asset id', () => {
        expect(
            parseEthereumTransferLink(
                `ethereum:${USDT}@1/transfer?address=${RECIPIENT}&uint256=1e6`
            )
        ).toEqual({
            address: RECIPIENT,
            assetId: `eth/mainnet/erc20/${USDT}`,
            amount: '1000000'
        });
    });

    it('an ERC-20 transfer without a chain id keeps the contract for probing', () => {
        expect(
            parseEthereumTransferLink(`ethereum:${USDT}/transfer?address=${RECIPIENT}&uint256=5`)
        ).toEqual({
            address: RECIPIENT,
            erc20Contract: USDT,
            amount: '5'
        });
    });

    it('an ERC-20 transfer without an amount is accepted', () => {
        expect(
            parseEthereumTransferLink(`ethereum:${USDT}@8453/transfer?address=${RECIPIENT}`)
        ).toEqual({
            address: RECIPIENT,
            assetId: `base/mainnet/erc20/${USDT}`,
            amount: undefined
        });
    });

    it('accepts the pay- prefix, the eth: scheme, and a case-insensitive scheme', () => {
        expect(parseEthereumTransferLink(`ethereum:pay-${RECIPIENT}@56?value=1e18`)).toMatchObject({
            assetId: 'bsc/mainnet/coin'
        });
        expect(parseEthereumTransferLink(`eth:${RECIPIENT}@42161?value=1`)).toMatchObject({
            assetId: 'arb/mainnet/coin'
        });
        expect(parseEthereumTransferLink(`Ethereum:${RECIPIENT}`)).not.toBeNull();
    });

    it('preserves checksum casing and ignores gas parameters', () => {
        const result = parseEthereumTransferLink(
            `ethereum:${RECIPIENT}@1?value=1&gas=21000&gasPrice=100`
        );
        expect(result?.address).toBe(RECIPIENT);
    });

    it('rejects an unsupported chain id, function, or missing transfer recipient', () => {
        expect(parseEthereumTransferLink(`ethereum:${RECIPIENT}@137?value=1`)).toBeNull();
        expect(
            parseEthereumTransferLink(`ethereum:${USDT}@1/approve?address=${RECIPIENT}&uint256=1`)
        ).toBeNull();
        expect(parseEthereumTransferLink(`ethereum:${USDT}@1/transfer?uint256=1`)).toBeNull();
    });

    it('rejects ENS names, unknown prefixes and non-ethereum schemes', () => {
        expect(parseEthereumTransferLink('ethereum:vitalik.eth@1?value=1')).toBeNull();
        expect(parseEthereumTransferLink(`ethereum:vote-${RECIPIENT}@1`)).toBeNull();
        expect(parseEthereumTransferLink(`ton://transfer/${RECIPIENT}`)).toBeNull();
    });

    it('a malformed amount rejects the whole link', () => {
        expect(parseEthereumTransferLink(`ethereum:${RECIPIENT}@1?value=abc`)).toBeNull();
        // Not a whole number of atomic units.
        expect(parseEthereumTransferLink(`ethereum:${RECIPIENT}@1?value=1.5`)).toBeNull();
        expect(parseEthereumTransferLink(`ethereum:${RECIPIENT}@1?value=1e100`)).toBeNull();
    });
});

describe('parseBrowserDeeplink network', () => {
    it('passes the network query through lowercased', () => {
        expect(parseBrowserDeeplink('tonkeeper://browser?network=ETH')).toEqual({
            network: 'eth'
        });
    });
});

describe('single-segment navigation deeplinks', () => {
    it('parses staking, receive, backup, add-wallet and main', () => {
        expect(parseStakingDeeplink('tonkeeper://staking')).toBe(true);
        expect(parseReceiveDeeplink('https://app.tonkeeper.com/receive')).toBe(true);
        expect(parseBackupDeeplink('tonkeeper://backup/')).toBe(true);
        expect(parseAddWalletDeeplink('tonkeeper://add-wallet')).toBe(true);
        expect(parseMainDeeplink('tonkeeper://main')).toBe(true);
        expect(parseMainDeeplink('tonkeeper://wallet')).toBe(true);
    });

    it('rejects extra path segments and other routes', () => {
        expect(parseStakingDeeplink('tonkeeper://staking/pool')).toBeNull();
        expect(parseReceiveDeeplink('tonkeeper://battery')).toBeNull();
        expect(parseMainDeeplink('tonkeeper://wallet/settings')).toBeNull();
    });
});

describe('parseDepositDeeplink / parseWithdrawDeeplink', () => {
    it('parses the ramp hints', () => {
        expect(
            parseDepositDeeplink('tonkeeper://deposit?ft=USD&tt=USDT&tn=tron&cm=card&it=Buy')
        ).toEqual({
            fromToken: 'USD',
            toToken: 'USDT',
            fromNetwork: undefined,
            toNetwork: 'tron',
            cashMethod: 'card',
            itemType: 'buy'
        });
        expect(parseWithdrawDeeplink('https://app.tonkeeper.com/withdraw?ft=TON')).toEqual({
            fromToken: 'TON',
            toToken: undefined,
            fromNetwork: undefined,
            toNetwork: undefined,
            cashMethod: undefined,
            itemType: undefined
        });
    });

    it('does not match each other or other routes', () => {
        expect(parseDepositDeeplink('tonkeeper://withdraw')).toBeNull();
        expect(parseWithdrawDeeplink('tonkeeper://deposit')).toBeNull();
        expect(parseDepositDeeplink('tonkeeper://deposit/extra')).toBeNull();
    });
});

describe('parseTradingDeeplink', () => {
    it('parses the bare trade tab link', () => {
        expect(parseTradingDeeplink('tonkeeper://trading')).toEqual({});
    });

    it('reads the shelf from the path (iOS) or the query (Android)', () => {
        expect(parseTradingDeeplink('tonkeeper://trading/top_gainers')).toEqual({
            shelf: 'top_gainers'
        });
        expect(parseTradingDeeplink('tonkeeper://trading?shelf=trending')).toEqual({
            shelf: 'trending'
        });
    });

    it('returns null for deeper paths and other routes', () => {
        expect(parseTradingDeeplink('tonkeeper://trading/a/b')).toBeNull();
        expect(parseTradingDeeplink('tonkeeper://swap')).toBeNull();
    });
});

describe('parseTradeAssetDeeplink', () => {
    it('joins the asset id back from the path segments', () => {
        expect(parseTradeAssetDeeplink('tonkeeper://assets/ton/mainnet/coin')).toEqual({
            assetId: 'ton/mainnet/coin'
        });
        expect(
            parseTradeAssetDeeplink(
                'https://app.tonkeeper.com/assets/eth/mainnet/erc20/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
            )
        ).toEqual({ assetId: 'eth/mainnet/erc20/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' });
    });

    it('rejects an empty or malformed id', () => {
        expect(parseTradeAssetDeeplink('tonkeeper://assets')).toBeNull();
        expect(parseTradeAssetDeeplink('tonkeeper://assets/ton')).toBeNull();
    });
});

describe('parseDappDeeplink', () => {
    it('assumes https for a bare host and keeps the path and query', () => {
        expect(parseDappDeeplink('tonkeeper://dapp/getgems.io/collection?x=1')).toEqual({
            url: 'https://getgems.io/collection?x=1'
        });
    });

    it('accepts a full, percent-encoded URL', () => {
        expect(
            parseDappDeeplink('https://app.tonkeeper.com/dapp/https%3A%2F%2Fgetgems.io%2Fpath')
        ).toEqual({ url: 'https://getgems.io/path' });
    });

    it('rejects non-web schemes and a missing target', () => {
        expect(parseDappDeeplink('tonkeeper://dapp/javascript:alert(1)')).toBeNull();
        expect(parseDappDeeplink('tonkeeper://dapp')).toBeNull();
        expect(parseDappDeeplink('tonkeeper://browser')).toBeNull();
    });
});
