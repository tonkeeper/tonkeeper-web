import {
    RawPromotedApp,
    RawPromotionCategory,
    RawRecommendations
} from '../tonkeeperApi/tonendpoint';

/**
 * Chain-aware view of the dApps catalog rendered by the multichain Browser
 * tab, served by the tonendpoint `/apps/popular` endpoint (the same backend
 * the native apps consume). Chains use the portfolio's network codes
 * (`'ton'`, `'eth'`, `'btc'`, …).
 */
export interface BrowserApp {
    id: string;
    name: string;
    description: string;
    url: string;
    icon: string;
    /** Wide banner image; only carousel entries carry one. */
    poster?: string;
    /** Network codes the dApp targets; empty = chain-agnostic. */
    chains: string[];
    /** Campaign id the backend attaches to promoted entries, for analytics. */
    bannerId?: string;
}

/**
 * The network badge an app card shows. Per the design it appears only when
 * the app targets exactly one network; multi-network and chain-agnostic apps
 * carry no badge.
 */
export const browserAppBadgeChain = (app: Pick<BrowserApp, 'chains'>): string | undefined =>
    app.chains.length === 1 ? app.chains[0] : undefined;

export interface BrowserCategory {
    id: string;
    title: string;
    apps: BrowserApp[];
}

/**
 * The Explore tab's blocks, split the way the native apps split the same
 * response: the `featured` category feeds the poster carousel, the
 * `digital_nomads` category renders as an untitled icon row pinned above the
 * chain-filter tabs (and therefore never chain-filtered), `ads` is dropped
 * (the web client doesn't request ads), and every other category becomes a
 * titled section below the tabs.
 */
export interface BrowserCatalog {
    banners: BrowserApp[];
    servicesRow: BrowserApp[];
    categories: BrowserCategory[];
}

const FEATURED_CATEGORY_ID = 'featured';
const SERVICES_ROW_CATEGORY_ID = 'digital_nomads';
const ADS_CATEGORY_ID = 'ads';

/**
 * Section grid geometry on the Explore tab: at most two rows, and the second
 * row renders only when it has at least 3 entries (a 1–2 app remainder is
 * pushed behind "See All" instead). {@link CATEGORY_ROW_SIZE} is the mobile
 * track; {@link CATEGORY_DESKTOP_ROW_SIZE} is the desktop track.
 */
export const CATEGORY_ROW_SIZE = 4;
export const CATEGORY_DESKTOP_ROW_SIZE = 5;
const MAX_EXPLORE_ROWS = 2;
const MIN_APPS_IN_SECOND_ROW = 3;

const toBrowserApp = (app: RawPromotedApp): BrowserApp | undefined => {
    // The OpenAPI spec marks `url` and `icon` optional; entries missing
    // either cannot be rendered or opened, so they are dropped here.
    if (typeof app.url !== 'string' || typeof app.icon !== 'string') {
        return undefined;
    }
    return {
        id: app.id,
        name: app.name,
        description: app.description,
        url: app.url,
        icon: app.icon,
        poster: app.poster,
        chains: app.chains,
        bannerId: app.bannerId
    };
};

const toBrowserApps = (apps: RawPromotedApp[]): BrowserApp[] =>
    apps.map(toBrowserApp).filter((app): app is BrowserApp => app !== undefined);

export const toBrowserCatalog = (raw: RawRecommendations): BrowserCatalog => {
    const featured = raw.categories.find(category => category.id === FEATURED_CATEGORY_ID);
    const servicesRow = raw.categories.find(category => category.id === SERVICES_ROW_CATEGORY_ID);
    const sections = raw.categories.filter(
        (category: RawPromotionCategory) =>
            category.id !== FEATURED_CATEGORY_ID &&
            category.id !== SERVICES_ROW_CATEGORY_ID &&
            category.id !== ADS_CATEGORY_ID
    );

    // Older backends carried the carousel in the top-level `apps` array
    // instead of a `featured` category; take whichever is populated.
    const bannerSource = featured?.apps.length ? featured.apps : raw.apps;

    return {
        banners: toBrowserApps(bannerSource).filter(app => app.poster !== undefined),
        servicesRow: servicesRow ? toBrowserApps(servicesRow.apps) : [],
        categories: sections
            .map(category => ({
                id: category.id,
                title: category.title,
                apps: toBrowserApps(category.apps)
            }))
            .filter(category => category.apps.length > 0)
    };
};

/**
 * Chain codes present in the catalog's sections, in first-appearance order.
 * The UI offers a filter chip per code, so a TON-only catalog yields a single
 * "TON" chip next to "All". Banners and the services row sit above the chain
 * tabs and don't contribute.
 */
export const catalogChains = (catalog: BrowserCatalog): string[] => {
    const chains: string[] = [];
    for (const category of catalog.categories) {
        for (const app of category.apps) {
            for (const chain of app.chains) {
                if (!chains.includes(chain)) {
                    chains.push(chain);
                }
            }
        }
    }
    return chains;
};

/**
 * Narrows the catalog's sections to one chain: an app stays when the chain
 * is among the ones it targets. Sections that come out empty are dropped
 * entirely — per the mockup, an empty section is hidden, not rendered blank.
 * Chain-agnostic apps (no chains) only show under "All", mirroring the
 * native filter.
 */
export const filterCategoriesByChain = (
    categories: BrowserCategory[],
    chain?: string
): BrowserCategory[] => {
    if (chain === undefined) {
        return categories;
    }
    return categories
        .map(category => ({
            ...category,
            apps: category.apps.filter(app => app.chains.includes(chain))
        }))
        .filter(category => category.apps.length > 0);
};

/**
 * Local catalog search behind the "Search or enter address" field: a
 * case-insensitive contains-match over name, description and URL,
 * deduplicated by app id (the same dApp can sit in several categories).
 */
export const searchBrowserApps = (catalog: BrowserCatalog, query: string): BrowserApp[] => {
    const needle = query.trim().toLowerCase();
    if (needle === '') {
        return [];
    }
    const seen = new Set<string>();
    const result: BrowserApp[] = [];
    const consider = (apps: BrowserApp[]) => {
        for (const app of apps) {
            if (seen.has(app.id)) {
                continue;
            }
            if (
                app.name.toLowerCase().includes(needle) ||
                app.description.toLowerCase().includes(needle) ||
                app.url.toLowerCase().includes(needle)
            ) {
                seen.add(app.id);
                result.push(app);
            }
        }
    };
    consider(catalog.servicesRow);
    catalog.categories.forEach(category => consider(category.apps));
    consider(catalog.banners);
    return result;
};

/**
 * Apps a category shows on the Explore tab before "See All": up to two rows
 * of `rowSize`, with an under-filled second row suppressed.
 */
export const categoryExploreApps = (
    apps: BrowserApp[],
    rowSize: number = CATEGORY_ROW_SIZE
): BrowserApp[] => {
    const limit = Math.min(apps.length, rowSize * MAX_EXPLORE_ROWS);
    if (limit > rowSize && limit - rowSize < MIN_APPS_IN_SECOND_ROW) {
        return apps.slice(0, rowSize);
    }
    return apps.slice(0, limit);
};
