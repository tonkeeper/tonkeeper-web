/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

import {
    CATALOG_SORTINGS,
    catalogPresetForShelf,
    chartPriceChange,
    chunkAssetIds,
    getAssetCharts,
    getAssetDetails,
    getShelvesConfig,
    getTradingAssets,
    getTradingAssetsByIds
} from '../tradingService';

function makeFetch(status: number, body: unknown): typeof fetch {
    return vi.fn(async () => {
        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: 'STATUS',
            json: async () => body
        } as Response;
    }) as unknown as typeof fetch;
}

function urlOf(fetchImpl: typeof fetch, call = 0): string {
    return (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[call][0] as string;
}

const rawMarketItem = {
    asset: {
        asset_type: 'asset',
        id: 'ton/mainnet/coin',
        symbol: 'TON',
        name: 'Toncoin',
        decimals: 9,
        trust_score: 95,
        image_url: 'https://example/ton.svg',
        is_scam: false,
        verification: 'whitelist'
    },
    metrics: {
        price: '1.84',
        volume: '10000000',
        change_24h_percent: '+7.32',
        provider: 'dyor',
        as_of: '2026-07-08T00:00:00Z'
    }
};

const marketItemForId = (id: string) => ({
    ...rawMarketItem,
    asset: { ...rawMarketItem.asset, id }
});

describe('getAssetDetails', () => {
    const rawDetails = {
        asset: {
            asset_type: 'asset',
            id: 'ton/mainnet/coin',
            symbol: 'TON',
            name: 'Toncoin',
            decimals: 9,
            trust_score: 95,
            image_url: 'https://example/ton.svg',
            is_scam: false,
            verification: 'whitelist'
        },
        sections: {
            about: { enabled: true, text: 'About TON', source: 'dyor' },
            overview: {
                enabled: true,
                market_cap: '1000',
                total_supply: '5127180163000000000',
                circulating_supply: '2839358502148720000'
            },
            trading_activity: {
                enabled: false,
                volume_change_24h: '+1.2%',
                volume_24h: '500',
                note: 'unavailable for RWA'
            },
            links: {
                enabled: true,
                items: [{ name: 'Website', url: 'https://ton.org', type: 'website' }]
            }
        },
        capabilities: {
            capabilities: ['onramp', 'swap', 'p2p'],
            details: {
                onramp: { merchants: ['mercuryo', 'moonpay'] },
                swap: { aggregators: ['omniston'] },
                p2p: { symbol: 'TON' }
            }
        },
        data_freshness_sec: 30
    };

    it('maps the wire response into AssetDetails', async () => {
        const fetchImpl = makeFetch(200, rawDetails);
        const res = await getAssetDetails({
            assetId: 'ton/mainnet/coin',
            currency: 'USD',
            fetchImpl
        });

        expect(res.asset).toEqual({
            assetType: 'asset',
            assetId: 'ton/mainnet/coin',
            symbol: 'TON',
            name: 'Toncoin',
            decimals: 9,
            trustScore: 95,
            image: 'https://example/ton.svg',
            isScam: false,
            verification: 'whitelist'
        });
        expect(res.overview).toMatchObject({
            enabled: true,
            marketCap: '1000',
            totalSupply: '5127180163',
            circulatingSupply: '2839358502.14872'
        });
        expect(res.tradingActivity).toMatchObject({ enabled: false, volumeChange24h: '+1.2%' });
        expect(res.links.items).toEqual([
            { name: 'Website', url: 'https://ton.org', type: 'website' }
        ]);
        expect(res.dataFreshnessSec).toBe(30);
    });

    it('maps capabilities with merchant / aggregator / p2p details', async () => {
        const fetchImpl = makeFetch(200, rawDetails);
        const res = await getAssetDetails({ assetId: 'x', currency: 'USD', fetchImpl });
        expect(res.capabilities).toEqual({
            capabilities: ['onramp', 'swap', 'p2p'],
            onrampMerchants: ['mercuryo', 'moonpay'],
            offrampMerchants: [],
            swapAggregators: ['omniston'],
            p2pSymbol: 'TON'
        });
    });

    it('leaves capabilities undefined when the server omits them', async () => {
        const { capabilities: _, ...withoutCapabilities } = rawDetails;
        const fetchImpl = makeFetch(200, withoutCapabilities);
        const res = await getAssetDetails({ assetId: 'x', currency: 'USD', fetchImpl });
        expect(res.capabilities).toBeUndefined();
    });

    it('defaults links.items to an empty array when absent', async () => {
        const fetchImpl = makeFetch(200, {
            ...rawDetails,
            sections: { ...rawDetails.sections, links: { enabled: false } }
        });
        const res = await getAssetDetails({ assetId: 'x', currency: 'USD', fetchImpl });
        expect(res.links.items).toEqual([]);
    });

    it('requests the v2 endpoint with lowercased currency and encoded assetId', async () => {
        const fetchImpl = makeFetch(200, rawDetails);
        await getAssetDetails({ assetId: 'ton/mainnet/coin', currency: 'EUR', fetchImpl });
        const url = urlOf(fetchImpl);
        expect(url).toContain('/api/v2/trading/assets/ton%2Fmainnet%2Fcoin/details?');
        expect(url).toContain('currency=eur');
    });

    it('sends the X-Lang header when lang is provided', async () => {
        const fetchImpl = makeFetch(200, rawDetails);
        await getAssetDetails({ assetId: 'x', currency: 'USD', lang: 'ru', fetchImpl });
        const init = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
            .calls[0][1] as RequestInit;
        expect((init.headers as Record<string, string>)['X-Lang']).toBe('ru');
    });

    it('rejects with the response attached on a non-2xx status', async () => {
        const fetchImpl = makeFetch(503, {});
        await expect(
            getAssetDetails({ assetId: 'ton', currency: 'USD', fetchImpl })
        ).rejects.toMatchObject({ response: { status: 503 } });
    });
});

describe('getTradingAssets', () => {
    it('maps items and the pagination cursor', async () => {
        const fetchImpl = makeFetch(200, { items: [rawMarketItem], next_cursor: 'page-2' });
        const res = await getTradingAssets({ currency: 'USD', fetchImpl });

        expect(res.items).toEqual([
            {
                assetId: 'ton/mainnet/coin',
                assetType: 'asset',
                symbol: 'TON',
                name: 'Toncoin',
                decimals: 9,
                image: 'https://example/ton.svg',
                isScam: false,
                verification: 'whitelist',
                trustScore: 95,
                price: '1.84',
                change24hPercent: '+7.32'
            }
        ]);
        expect(res.nextCursor).toBe('page-2');
    });

    it('returns an empty nextCursor when the server omits it', async () => {
        const fetchImpl = makeFetch(200, { items: [] });
        const res = await getTradingAssets({ currency: 'USD', fetchImpl });
        expect(res.items).toEqual([]);
        expect(res.nextCursor).toBe('');
    });

    it('passes through the chains the first page lists', async () => {
        const fetchImpl = makeFetch(200, { items: [], chains: ['eth', 'ton'] });
        const res = await getTradingAssets({ currency: 'USD', fetchImpl });
        expect(res.chains).toEqual(['eth', 'ton']);
    });

    it('keeps an empty chains list distinct from a missing one', async () => {
        const empty = await getTradingAssets({
            currency: 'USD',
            fetchImpl: makeFetch(200, { items: [], chains: [] })
        });
        expect(empty.chains).toEqual([]);

        const missing = await getTradingAssets({
            currency: 'USD',
            fetchImpl: makeFetch(200, { items: [] })
        });
        expect(missing.chains).toBeUndefined();
    });

    it('passes every supplied query parameter to the v2 endpoint', async () => {
        const fetchImpl = makeFetch(200, { items: [] });
        await getTradingAssets({
            currency: 'EUR',
            tab: 'all',
            query: 'tsla',
            chain: 'sol',
            sort: 'market_cap',
            order: 'asc',
            filter: 'stocks',
            sourceShelf: 'stocks',
            cursor: 'c1',
            pageSize: 25,
            fetchImpl
        });
        const url = urlOf(fetchImpl);
        expect(url).toContain('/api/v2/trading/assets?');
        expect(url).toContain('currency=eur');
        expect(url).toContain('tab=all');
        expect(url).toContain('q=tsla');
        expect(url).toContain('chain=sol');
        expect(url).toContain('sort=market_cap');
        expect(url).toContain('order=asc');
        expect(url).toContain('filter=stocks');
        expect(url).toContain('source_shelf=stocks');
        expect(url).toContain('cursor=c1');
        expect(url).toContain('page_size=25');
    });

    it('omits unset optional query parameters', async () => {
        const fetchImpl = makeFetch(200, { items: [] });
        await getTradingAssets({ currency: 'USD', fetchImpl });
        const url = urlOf(fetchImpl);
        expect(url).not.toContain('chain=');
        expect(url).not.toContain('sort=');
        expect(url).not.toContain('cursor=');
    });
});

describe('catalogPresetForShelf', () => {
    it('keeps all / tokens / perpetuals as the catalog tab', () => {
        expect(catalogPresetForShelf({ shelfKey: 'core', route: 'tokens' })).toEqual({
            tab: 'tokens'
        });
        expect(catalogPresetForShelf({ route: 'perpetuals' })).toEqual({ tab: 'perpetuals' });
    });

    it('sends the asset-class routes as a filter under the all tab', () => {
        expect(catalogPresetForShelf({ shelfKey: 'rwa', route: 'stocks' })).toEqual({
            tab: 'all',
            filter: 'stocks'
        });
        expect(catalogPresetForShelf({ shelfKey: 'commodities', route: 'commodities' })).toEqual({
            tab: 'all',
            filter: 'commodities'
        });
    });

    it('derives the filter from an asset-class shelf key when the route is a plain tab', () => {
        expect(catalogPresetForShelf({ shelfKey: 'etfs', route: 'all' })).toEqual({
            tab: 'all',
            filter: 'etfs'
        });
    });

    it('turns the movers shelves into a sort option instead of a filter', () => {
        expect(catalogPresetForShelf({ shelfKey: 'top_gainers', route: 'tokens' })).toEqual({
            tab: 'tokens',
            sorting: 'top_gainers'
        });
        expect(catalogPresetForShelf({ shelfKey: 'top_losers', route: 'tokens' })).toEqual({
            tab: 'tokens',
            sorting: 'top_losers'
        });
        expect(catalogPresetForShelf({ shelfKey: 'most_traded', route: 'all' })).toEqual({
            tab: 'all',
            sorting: 'volume'
        });
    });

    it('carries the trending toggles over as their metric', () => {
        expect(catalogPresetForShelf({ shelfKey: 'market_cap', route: 'all' })).toEqual({
            tab: 'all',
            sorting: 'market_cap'
        });
        expect(catalogPresetForShelf({ shelfKey: 'volume', route: 'all' })).toEqual({
            tab: 'all',
            sorting: 'volume'
        });
    });

    it('maps every sort option to a metric and direction the API accepts', () => {
        expect(CATALOG_SORTINGS.market_cap).toEqual({ sort: 'market_cap', order: 'desc' });
        expect(CATALOG_SORTINGS.volume).toEqual({ sort: 'volume_24h', order: 'desc' });
        expect(CATALOG_SORTINGS.top_gainers).toEqual({ sort: 'price_24h', order: 'desc' });
        expect(CATALOG_SORTINGS.top_losers).toEqual({ sort: 'price_24h', order: 'asc' });
    });

    it('drops unknown routes and shelves rather than forwarding them', () => {
        expect(catalogPresetForShelf({ shelfKey: 'mystery', route: 'unknown' })).toEqual({});
        expect(catalogPresetForShelf({})).toEqual({});
    });
});

describe('chunkAssetIds', () => {
    it('splits ids into chunks of at most 10 preserving order', () => {
        const ids = Array.from({ length: 25 }, (_, i) => `id-${i}`);
        const chunks = chunkAssetIds(ids);
        expect(chunks.map(c => c.length)).toEqual([10, 10, 5]);
        expect(chunks.flat()).toEqual(ids);
    });

    it('returns no chunks for an empty list', () => {
        expect(chunkAssetIds([])).toEqual([]);
    });
});

describe('getTradingAssetsByIds', () => {
    it('returns [] without any request for an empty ids list', async () => {
        const fetchImpl = makeFetch(200, { items: [] });
        const res = await getTradingAssetsByIds({ ids: [], currency: 'USD', fetchImpl });
        expect(res).toEqual([]);
        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('fans 25 ids out into 3 requests of at most 10 ids each', async () => {
        const ids = Array.from({ length: 25 }, (_, i) => `id-${i}`);
        const fetchImpl = vi.fn(async (url: string) => {
            const requested = new URL(url).searchParams.getAll('ids');
            return {
                ok: true,
                status: 200,
                statusText: 'OK',
                json: async () => ({ items: requested.map(marketItemForId) })
            } as Response;
        }) as unknown as typeof fetch;

        const res = await getTradingAssetsByIds({ ids, currency: 'USD', fetchImpl });

        expect(fetchImpl).toHaveBeenCalledTimes(3);
        expect(res.map(a => a.assetId)).toEqual(ids);
        const firstUrl = urlOf(fetchImpl);
        expect(new URL(firstUrl).searchParams.getAll('ids')).toHaveLength(10);
    });

    it('preserves the requested order regardless of response order and drops unknown ids', async () => {
        const fetchImpl = makeFetch(200, {
            items: [marketItemForId('b'), marketItemForId('a')]
        });
        const res = await getTradingAssetsByIds({
            ids: ['a', 'b', 'missing'],
            currency: 'USD',
            fetchImpl
        });
        expect(res.map(a => a.assetId)).toEqual(['a', 'b']);
    });

    it('rejects when any chunk request fails', async () => {
        let call = 0;
        const fetchImpl = vi.fn(async () => {
            call += 1;
            const failing = call === 2;
            return {
                ok: !failing,
                status: failing ? 500 : 200,
                statusText: 'STATUS',
                json: async () => ({ items: [] })
            } as Response;
        }) as unknown as typeof fetch;

        const ids = Array.from({ length: 15 }, (_, i) => `id-${i}`);
        await expect(getTradingAssetsByIds({ ids, currency: 'USD', fetchImpl })).rejects.toThrow();
    });
});

describe('getShelvesConfig', () => {
    const rawShelves = {
        groups: [
            {
                id: 'top_movers',
                name: 'Today’s top movers',
                groups: [
                    {
                        name: 'Ethereum',
                        items: [
                            {
                                key: 'top_gainers',
                                title: 'Top Gainers',
                                type: 'grid',
                                source: 'dyor',
                                see_all: { enabled: true, route: 'tokens' },
                                items: [rawMarketItem]
                            }
                        ]
                    }
                ]
            }
        ],
        generated_at: '2026-07-08T00:00:00Z'
    };

    it('maps groups > chains > shelves including nested market items', async () => {
        const fetchImpl = makeFetch(200, rawShelves);
        const res = await getShelvesConfig({ currency: 'USD', fetchImpl });

        expect(res.groups).toHaveLength(1);
        const group = res.groups[0];
        expect(group).toMatchObject({ id: 'top_movers', name: 'Today’s top movers' });
        expect(group.chains).toHaveLength(1);
        expect(group.chains[0].chain).toBe('Ethereum');
        const shelf = group.chains[0].shelves[0];
        expect(shelf).toMatchObject({
            key: 'top_gainers',
            title: 'Top Gainers',
            type: 'grid',
            source: 'dyor',
            seeAll: { enabled: true, route: 'tokens' }
        });
        expect(shelf.items).toHaveLength(1);
        expect(shelf.items[0]).toMatchObject({
            assetId: 'ton/mainnet/coin',
            price: '1.84',
            change24hPercent: '+7.32'
        });
    });

    it('requests the v2 endpoint with lowercased currency and X-Lang', async () => {
        const fetchImpl = makeFetch(200, { groups: [], generated_at: '2026-07-08T00:00:00Z' });
        await getShelvesConfig({ currency: 'EUR', lang: 'ru', fetchImpl });
        const url = urlOf(fetchImpl);
        expect(url).toContain('/api/v2/trading/shelves/config?');
        expect(url).toContain('currency=eur');
        const init = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
            .calls[0][1] as RequestInit;
        expect((init.headers as Record<string, string>)['X-Lang']).toBe('ru');
    });
});

describe('getAssetCharts', () => {
    it('normalises tuples into ChartPoints, deduping timestamps and sorting ascending', async () => {
        const fetchImpl = makeFetch(200, [
            [1700007200, 2.1],
            [1700003600, 1.95],
            [1700003600, 1.9],
            [1700000000, 1.8]
        ]);
        const res = await getAssetCharts({ assetId: 'ton', currency: 'USD', fetchImpl });
        expect(res).toEqual([
            { timestamp: 1700000000, price: 1.8 },
            { timestamp: 1700003600, price: 1.95 },
            { timestamp: 1700007200, price: 2.1 }
        ]);
    });

    it('coerces string tuple values and skips malformed points', async () => {
        const fetchImpl = makeFetch(200, [
            ['1700000000', '1.8'],
            ['not-a-ts', '1'],
            [1700003600, 'nan-price-skipped-only-if-nan'],
            [1700007200, '2.1']
        ]);
        const res = await getAssetCharts({ assetId: 'ton', currency: 'USD', fetchImpl });
        expect(res).toEqual([
            { timestamp: 1700000000, price: 1.8 },
            { timestamp: 1700007200, price: 2.1 }
        ]);
    });

    it('passes the window and points-count query parameters to the v2 endpoint', async () => {
        const fetchImpl = makeFetch(200, []);
        await getAssetCharts({
            assetId: 'ton/mainnet/coin',
            currency: 'USD',
            startDate: 100,
            endDate: 200,
            pointsCount: 50,
            fetchImpl
        });
        const url = urlOf(fetchImpl);
        expect(url).toContain('/api/v2/trading/assets/ton%2Fmainnet%2Fcoin/charts?');
        expect(url).toContain('start_date=100');
        expect(url).toContain('end_date=200');
        expect(url).toContain('points_count=50');
    });

    it('rejects with the response attached on a non-2xx status', async () => {
        const fetchImpl = makeFetch(404, {});
        await expect(
            getAssetCharts({ assetId: 'ton', currency: 'USD', fetchImpl })
        ).rejects.toMatchObject({ response: { status: 404 } });
    });
});

describe('chartPriceChange', () => {
    const first = { timestamp: 100, price: 2 };

    it('measures a rise against the first point', () => {
        const change = chartPriceChange(first, { timestamp: 200, price: 2.5 });
        expect(change.diffPercent).toBeCloseTo(25);
        expect(change.diffFiat).toBeCloseTo(0.5);
    });

    it('measures a fall against the first point', () => {
        const change = chartPriceChange(first, { timestamp: 200, price: 1.5 });
        expect(change.diffPercent).toBeCloseTo(-25);
        expect(change.diffFiat).toBeCloseTo(-0.5);
    });

    it('is zero for the first point itself', () => {
        expect(chartPriceChange(first, first)).toEqual({ diffPercent: 0, diffFiat: 0 });
    });

    it('reports no percentage when the window starts at a zero price', () => {
        const change = chartPriceChange({ timestamp: 100, price: 0 }, { timestamp: 200, price: 3 });
        expect(change).toEqual({ diffPercent: 0, diffFiat: 3 });
    });
});
