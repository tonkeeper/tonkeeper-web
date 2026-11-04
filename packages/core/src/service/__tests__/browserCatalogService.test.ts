/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import {
    BrowserApp,
    BrowserCategory,
    browserAppBadgeChain,
    CATEGORY_DESKTOP_ROW_SIZE,
    catalogChains,
    categoryExploreApps,
    filterCategoriesByChain,
    searchBrowserApps,
    toBrowserCatalog
} from '../browserCatalogService';
import { RawPromotedApp, RawRecommendations } from '../../tonkeeperApi/tonendpoint';

const app = (overrides: Partial<RawPromotedApp> & { id: string }): RawPromotedApp => ({
    name: overrides.id,
    description: `${overrides.id} description`,
    url: `https://${overrides.id}.example`,
    icon: `https://${overrides.id}.example/icon.png`,
    chains: ['ton'],
    ...overrides
});

const raw = (overrides: Partial<RawRecommendations> = {}): RawRecommendations => ({
    moreEnabled: false,
    apps: [],
    categories: [],
    ...overrides
});

describe('toBrowserCatalog', () => {
    it('keeps every chain the backend tags an entry with', () => {
        const catalog = toBrowserCatalog(
            raw({
                categories: [
                    {
                        id: 'defi',
                        title: 'DeFi',
                        apps: [
                            app({ id: 'dex' }),
                            app({ id: 'lending', chains: ['ton', 'eth', 'arb', 'base', 'bsc'] }),
                            app({ id: 'agnostic', chains: [] })
                        ]
                    }
                ]
            })
        );

        expect(catalog.categories[0].apps.map(a => a.chains)).toEqual([
            ['ton'],
            ['ton', 'eth', 'arb', 'base', 'bsc'],
            []
        ]);
    });

    it('splits featured into banners and digital_nomads into the services row, dropping ads', () => {
        const catalog = toBrowserCatalog(
            raw({
                categories: [
                    {
                        id: 'featured',
                        title: 'Featured',
                        apps: [app({ id: 'banner', poster: 'https://p.example/b.png' })]
                    },
                    { id: 'digital_nomads', title: 'Services', apps: [app({ id: 'esim' })] },
                    { id: 'ads', title: 'Ads', apps: [app({ id: 'promo' })] },
                    { id: 'defi', title: 'DeFi', apps: [app({ id: 'dex' })] }
                ]
            })
        );

        expect(catalog.banners.map(a => a.id)).toEqual(['banner']);
        expect(catalog.servicesRow.map(a => a.id)).toEqual(['esim']);
        expect(catalog.categories.map(c => c.id)).toEqual(['defi']);
    });

    it('falls back to the top-level apps array for banners when featured is absent', () => {
        const catalog = toBrowserCatalog(
            raw({
                apps: [
                    app({ id: 'with-poster', poster: 'https://p.example/a.png' }),
                    app({ id: 'without-poster' })
                ]
            })
        );

        expect(catalog.banners.map(b => b.id)).toEqual(['with-poster']);
    });

    it('drops entries missing url or icon and prunes categories that end up empty', () => {
        const catalog = toBrowserCatalog(
            raw({
                categories: [
                    {
                        id: 'defi',
                        title: 'DeFi',
                        apps: [app({ id: 'ok' }), app({ id: 'no-url', url: undefined })]
                    },
                    {
                        id: 'games',
                        title: 'Games',
                        apps: [app({ id: 'no-icon', icon: undefined })]
                    }
                ]
            })
        );

        expect(catalog.categories.map(c => c.id)).toEqual(['defi']);
        expect(catalog.categories[0].apps.map(a => a.id)).toEqual(['ok']);
    });
});

const browserApp = (id: string, ...chains: string[]): BrowserApp => ({
    id,
    name: id,
    description: '',
    url: `https://${id}.example`,
    icon: `https://${id}.example/icon.png`,
    chains
});

const category = (id: string, apps: BrowserApp[]): BrowserCategory => ({
    id,
    title: id,
    apps
});

describe('browserAppBadgeChain', () => {
    it('badges only apps that target exactly one network', () => {
        expect(browserAppBadgeChain(browserApp('a', 'eth'))).toBe('eth');
        expect(browserAppBadgeChain(browserApp('b', 'ton', 'eth'))).toBeUndefined();
        expect(browserAppBadgeChain(browserApp('c'))).toBeUndefined();
    });
});

describe('catalogChains', () => {
    it('collects unique section chain codes in first-appearance order, skipping chain-agnostic apps', () => {
        const chains = catalogChains({
            banners: [browserApp('banner', 'eth')],
            servicesRow: [browserApp('service', 'btc')],
            categories: [
                category('defi', [
                    browserApp('a', 'ton'),
                    browserApp('b'),
                    browserApp('c', 'eth', 'arb'),
                    browserApp('d', 'ton')
                ])
            ]
        });

        expect(chains).toEqual(['ton', 'eth', 'arb']);
    });
});

describe('filterCategoriesByChain', () => {
    const categories = [
        category('defi', [
            browserApp('dex-ton', 'ton'),
            browserApp('dex-eth', 'eth'),
            browserApp('lending-multi', 'ton', 'eth', 'arb')
        ]),
        category('games', [browserApp('game-eth', 'eth'), browserApp('game-any')])
    ];

    it('returns the sections untouched for the "All" filter', () => {
        expect(filterCategoriesByChain(categories, undefined)).toBe(categories);
    });

    it('keeps apps targeting the chain and hides sections that become empty', () => {
        const filtered = filterCategoriesByChain(categories, 'ton');

        expect(filtered.map(c => c.id)).toEqual(['defi']);
        expect(filtered[0].apps.map(a => a.id)).toEqual(['dex-ton', 'lending-multi']);
    });

    it('shows chain-agnostic apps under "All" only', () => {
        const filtered = filterCategoriesByChain(categories, 'eth');

        expect(filtered.map(c => c.id)).toEqual(['defi', 'games']);
        expect(filtered[1].apps.map(a => a.id)).toEqual(['game-eth']);
    });
});

describe('searchBrowserApps', () => {
    const catalog = {
        banners: [browserApp('getgems', 'ton')],
        servicesRow: [browserApp('esim', 'ton')],
        categories: [
            category('defi', [
                { ...browserApp('aave', 'eth'), description: 'Lending protocol' },
                browserApp('getgems', 'ton')
            ])
        ]
    };

    it('matches name, description and url case-insensitively and dedupes by id', () => {
        expect(searchBrowserApps(catalog, 'GEMS').map(a => a.id)).toEqual(['getgems']);
        expect(searchBrowserApps(catalog, 'lending').map(a => a.id)).toEqual(['aave']);
        expect(searchBrowserApps(catalog, 'esim.example').map(a => a.id)).toEqual(['esim']);
    });

    it('returns nothing for a blank query', () => {
        expect(searchBrowserApps(catalog, '   ')).toEqual([]);
    });
});

describe('categoryExploreApps', () => {
    const apps = (count: number) => Array.from({ length: count }, (_, i) => browserApp(`a${i}`));

    it('shows everything up to two full rows', () => {
        expect(categoryExploreApps(apps(4))).toHaveLength(4);
        expect(categoryExploreApps(apps(8))).toHaveLength(8);
        expect(categoryExploreApps(apps(12))).toHaveLength(8);
    });

    it('suppresses an under-filled second row', () => {
        expect(categoryExploreApps(apps(5))).toHaveLength(4);
        expect(categoryExploreApps(apps(6))).toHaveLength(4);
        expect(categoryExploreApps(apps(7))).toHaveLength(7);
    });

    it('uses the desktop row size when given', () => {
        const row = CATEGORY_DESKTOP_ROW_SIZE;
        expect(categoryExploreApps(apps(5), row)).toHaveLength(5);
        expect(categoryExploreApps(apps(6), row)).toHaveLength(5);
        expect(categoryExploreApps(apps(7), row)).toHaveLength(5);
        expect(categoryExploreApps(apps(8), row)).toHaveLength(8);
        expect(categoryExploreApps(apps(10), row)).toHaveLength(10);
        expect(categoryExploreApps(apps(12), row)).toHaveLength(10);
    });
});
