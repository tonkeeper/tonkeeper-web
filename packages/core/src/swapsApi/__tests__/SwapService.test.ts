/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { CrossSwapAsset } from '../SwapService';
import {
    crossSwapQuoteRequestOptions,
    decodeCrossSwapJson,
    encodeCrossSwapJson,
    fetchCrossSwapAsset,
    fetchCrossSwapAssets,
    fetchCrossSwapConfig,
    normalizeCrossSwapAsset,
    preferredCrossSwapRoute
} from '../SwapService';
import type { CrossSwapRoute } from '../../swapsApiGenerated';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('cross-chain JSON conversion', () => {
    it('decodes production response keys for generated models, including nested routes', () => {
        expect(
            decodeCrossSwapJson({
                asset_id: 'ton/mainnet/coin',
                chain_family: 'TON',
                supported_aggregators: ['omniston'],
                routes: [{ route_id: 'route-1', destination_amount: '100' }]
            })
        ).toEqual({
            assetId: 'ton/mainnet/coin',
            chainFamily: 'TON',
            supportedAggregators: ['omniston'],
            routes: [{ routeId: 'route-1', destinationAmount: '100' }]
        });
    });

    it('encodes generated request models using the backend contract', () => {
        expect(
            encodeCrossSwapJson({
                sourceAsset: 'ton/mainnet/coin',
                destinationAsset: 'btc/mainnet/coin',
                slippageBps: 100,
                exactType: 'exact_input'
            })
        ).toEqual({
            source_asset: 'ton/mainnet/coin',
            destination_asset: 'btc/mainnet/coin',
            slippage_bps: 100,
            exact_type: 'exact_input'
        });
    });
});

describe('normalizeCrossSwapAsset', () => {
    it('loads the production response shape through the generated client', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    assets: [
                        {
                            asset_id: 'ton/mainnet/coin',
                            chain_family: 'TON',
                            symbol: 'TON',
                            name: 'Toncoin',
                            decimals: 9,
                            supported_aggregators: ['omniston']
                        }
                    ]
                }),
                { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            )
        );
        vi.stubGlobal('fetch', fetchMock);

        const assets = await fetchCrossSwapAssets(
            'https://swap.tonkeeper.com',
            { limit: 1000 },
            { platform: 'web' }
        );

        expect(assets[0]).toMatchObject({
            assetId: 'ton/mainnet/coin',
            chainId: 'ton/mainnet',
            chainFamily: 'TON',
            supportedAggregators: ['omniston']
        });
        expect(fetchMock).toHaveBeenCalledWith(
            'https://swap.tonkeeper.com/v2/crosschain/assets?limit=1000&platform=web',
            expect.any(Object)
        );
    });

    it('derives chainId from the canonical assetId', () => {
        const asset = {
            assetId: 'eth/mainnet/erc20/0x1234',
            chainFamily: 'EVM',
            symbol: 'TEST',
            name: 'Test token',
            decimals: 18,
            supportedAggregators: ['swapsxyz']
        } as unknown as CrossSwapAsset;

        expect(normalizeCrossSwapAsset(asset).chainId).toBe('eth/mainnet');
    });
});

describe('fetchCrossSwapAsset', () => {
    it('loads one asset by its snake_case query id and normalizes it', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    asset_id: 'eth/mainnet/token/0x0e29e5abbb5fd88e28b2d355774e73bd47de3bcd',
                    chain_family: 'EVM',
                    symbol: 'HAKKA',
                    name: 'Hakka.Finance',
                    decimals: 18,
                    supported_aggregators: ['swapsxyz']
                }),
                { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
            )
        );
        vi.stubGlobal('fetch', fetchMock);

        const asset = await fetchCrossSwapAsset(
            'https://swap.tonkeeper.com',
            'eth/mainnet/token/0x0e29e5abbb5fd88e28b2d355774e73bd47de3bcd',
            { platform: 'web' }
        );

        expect(asset).toMatchObject({
            assetId: 'eth/mainnet/token/0x0e29e5abbb5fd88e28b2d355774e73bd47de3bcd',
            chainId: 'eth/mainnet',
            symbol: 'HAKKA'
        });
        expect(fetchMock).toHaveBeenCalledWith(
            'https://swap.tonkeeper.com/v2/crosschain/asset?asset_id=eth%2Fmainnet%2Ftoken%2F0x0e29e5abbb5fd88e28b2d355774e73bd47de3bcd&platform=web',
            expect.any(Object)
        );
    });

    it('resolves to undefined for an asset the catalog does not know', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ error: 'not found' }), {
                    status: 404,
                    headers: { 'Content-Type': 'application/json' }
                })
            )
        );

        await expect(
            fetchCrossSwapAsset('https://swap.tonkeeper.com', 'eth/mainnet/token/0xdead')
        ).resolves.toBeUndefined();
    });

    it('rethrows other failures', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })));

        await expect(
            fetchCrossSwapAsset('https://swap.tonkeeper.com', 'eth/mainnet/token/0xdead')
        ).rejects.toBeInstanceOf(Error);
    });
});

describe('fetchCrossSwapConfig', () => {
    const usdt = {
        asset_id: 'eth/mainnet/token/0xdac17f958d2ee523a2206206994597c13d831ec7',
        chain_family: 'EVM',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        supported_aggregators: ['swapsxyz']
    };
    const hakka = {
        asset_id: 'eth/mainnet/token/0x0e29e5abbb5fd88e28b2d355774e73bd47de3bcd',
        chain_family: 'EVM',
        symbol: 'HAKKA',
        name: 'Hakka.Finance',
        decimals: 18,
        supported_aggregators: ['swapsxyz']
    };

    it('pins the tapped side and returns both assets of the backend pair', async () => {
        const fetchMock = vi.fn().mockResolvedValue(
            new Response(
                JSON.stringify({
                    slippages: {
                        eth: { options_bps: [50, 100, 300], default_bps: 100 },
                        ton: { options_bps: [10, 50, 100], default_bps: 50 },
                        broken: { options_bps: 'nope', default_bps: 100 }
                    },
                    swap_pair: {
                        source_asset_id: usdt.asset_id,
                        destination_asset_id: hakka.asset_id,
                        source_asset: usdt,
                        destination_asset: hakka
                    }
                }),
                { headers: { 'Content-Type': 'application/json' } }
            )
        );
        vi.stubGlobal('fetch', fetchMock);

        const config = await fetchCrossSwapConfig(
            'https://swap.tonkeeper.com/',
            'wallet-1',
            { toAssetId: hakka.asset_id },
            { platform: 'web' }
        );

        expect(config.defaultPair.sourceAsset).toMatchObject({
            symbol: 'USDT',
            chainId: 'eth/mainnet'
        });
        expect(config.defaultPair.destinationAsset).toMatchObject({
            symbol: 'HAKKA',
            chainId: 'eth/mainnet'
        });
        expect(config.slippages).toEqual({
            eth: { optionsBps: [50, 100, 300], defaultBps: 100 },
            ton: { optionsBps: [10, 50, 100], defaultBps: 50 }
        });
        expect(fetchMock).toHaveBeenCalledWith(
            `https://swap.tonkeeper.com/v2/crosschain/wallet-1/config?to_asset_id=${encodeURIComponent(
                hakka.asset_id
            )}&platform=web`,
            expect.any(Object)
        );
    });

    it('rejects when the backend answers without a pair or with an error status', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                new Response(JSON.stringify({ slippages: {} }), {
                    headers: { 'Content-Type': 'application/json' }
                })
            )
        );
        await expect(
            fetchCrossSwapConfig('https://swap.tonkeeper.com', 'wallet-1', {})
        ).rejects.toThrow();

        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('boom', { status: 500 })));
        await expect(
            fetchCrossSwapConfig('https://swap.tonkeeper.com', 'wallet-1', {})
        ).rejects.toThrow();
    });
});

describe('crossSwapQuoteRequestOptions', () => {
    it('leaves partner selection to the backend and asks for inline payloads', () => {
        const options = crossSwapQuoteRequestOptions('eth/mainnet');
        expect(options).not.toHaveProperty('aggregators');
        expect(options.includePayload).toBe(true);
    });

    it('asks for a deposit address on every source but TON', () => {
        expect(crossSwapQuoteRequestOptions('eth/mainnet').returnDepositAddress).toBe(true);
        expect(crossSwapQuoteRequestOptions('btc/mainnet').returnDepositAddress).toBe(true);
        expect(crossSwapQuoteRequestOptions('ton/mainnet').returnDepositAddress).toBe(false);
    });
});

describe('preferredCrossSwapRoute', () => {
    const now = Date.parse('2026-09-16T12:00:00Z');
    const route = (
        routeId: string,
        aggregator: CrossSwapRoute['aggregator'],
        dateExpire = '2026-09-16T12:05:00Z'
    ): CrossSwapRoute =>
        ({ routeId, aggregator, dateExpire, tags: ['recommended'] } as unknown as CrossSwapRoute);

    it('prefers the live SwapsXYZ route over the first one', () => {
        const routes = [route('a', 'swapkit'), route('b', 'swapsxyz')];
        expect(preferredCrossSwapRoute(routes, now)?.routeId).toBe('b');
    });

    it('falls back to the first live route of another aggregator', () => {
        const routes = [route('a', 'swapkit'), route('b', 'omniston')];
        expect(preferredCrossSwapRoute(routes, now)?.routeId).toBe('a');
    });

    it('skips expired routes and yields nothing when all are expired', () => {
        const expired = route('a', 'swapsxyz', '2026-09-16T11:59:00Z');
        expect(preferredCrossSwapRoute([expired, route('b', 'swapkit')], now)?.routeId).toBe('b');
        expect(preferredCrossSwapRoute([expired], now)).toBeUndefined();
    });
});
