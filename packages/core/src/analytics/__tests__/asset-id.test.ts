/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { Network } from '../../entries/network';
import { nativeCoinAssetId, normalizeAnalyticsAssetId, tonCoinAssetId } from '../asset-id';

const JETTON_FRIENDLY = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const JETTON_RAW = '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe';

describe('normalizeAnalyticsAssetId', () => {
    it('spells the chain the way analytics does', () => {
        expect(normalizeAnalyticsAssetId('bsc/mainnet/coin')).toBe('bnb/mainnet/coin');
        expect(normalizeAnalyticsAssetId('bsc/mainnet/token/0xAbC')).toBe(
            'bnb/mainnet/token/0xAbC'
        );
    });

    it('leaves chains the analytics vocabulary already agrees on', () => {
        expect(normalizeAnalyticsAssetId('eth/mainnet/coin')).toBe('eth/mainnet/coin');
        expect(normalizeAnalyticsAssetId('ton/mainnet/coin')).toBe('ton/mainnet/coin');
        expect(normalizeAnalyticsAssetId('tron/mainnet/trc20/TR7NHq')).toBe(
            'tron/mainnet/trc20/TR7NHq'
        );
    });

    it('restates a TON address in the raw form', () => {
        expect(normalizeAnalyticsAssetId(`ton/mainnet/jetton/${JETTON_FRIENDLY}`)).toBe(
            `ton/mainnet/jetton/${JETTON_RAW}`
        );
        expect(normalizeAnalyticsAssetId(`ton/mainnet/jetton/${JETTON_RAW}`)).toBe(
            `ton/mainnet/jetton/${JETTON_RAW}`
        );
    });

    it('passes through what it cannot parse', () => {
        expect(normalizeAnalyticsAssetId('ton/mainnet/nft/notanaddress')).toBe(
            'ton/mainnet/nft/notanaddress'
        );
        expect(normalizeAnalyticsAssetId('foo')).toBe('foo');
    });

    it('keeps a chain code newer than this client', () => {
        expect(normalizeAnalyticsAssetId('newchain/mainnet/coin')).toBe('newchain/mainnet/coin');
    });
});

describe('nativeCoinAssetId', () => {
    it('spells the chain the way analytics does', () => {
        expect(nativeCoinAssetId('bsc', Network.MAINNET)).toBe('bnb/mainnet/coin');
        expect(nativeCoinAssetId('eth', Network.MAINNET)).toBe('eth/mainnet/coin');
    });

    it('agrees with tonCoinAssetId', () => {
        expect(nativeCoinAssetId('ton', Network.MAINNET)).toBe(tonCoinAssetId(Network.MAINNET));
        expect(nativeCoinAssetId('ton', Network.TESTNET)).toBe(tonCoinAssetId(Network.TESTNET));
    });
});
