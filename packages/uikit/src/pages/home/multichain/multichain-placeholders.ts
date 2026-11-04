import BigNumber from 'bignumber.js';

import type { MultichainActivity } from '@tonkeeper/core/dist/service/multichainActivityService';
import type {
    BrowserApp,
    BrowserCategory
} from '@tonkeeper/core/dist/service/browserCatalogService';
import type { NFT } from '@tonkeeper/core/dist/entries/nft';
import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import type {
    TradingMarketAsset,
    TradingShelfGroup
} from '@tonkeeper/core/dist/service/tradingService';

/**
 * Stub rows the asset screens render while their real query is in flight, so
 * the loading state is the production layout with its values masked rather than
 * a hand-drawn skeleton that has to be re-aligned every time the layout moves.
 *
 * Values are arbitrary: every field they feed is covered by a mask bar whose
 * width comes from the loading mockup. They only have to be non-empty, because
 * an element with no content has no line box for the bar to sit in — and
 * shape-valid, which `satisfies` enforces against the generated model so a
 * backend change fails the build instead of quietly emptying the skeleton.
 *
 * The network segment is deliberately not `ton`: these rows must not match any
 * chain-specific branch (liquid-staking filtering, the staked-row insertion
 * point) while they stand in for real assets.
 */
const placeholderAsset = (index: number) =>
    ({
        assetId: `placeholder/evm/token/${index}`,
        chain: 'evm',
        name: 'Placeholder',
        symbol: 'TOKEN',
        decimals: 9,
        balance: '2345000000000',
        image: '',
        verification: 'whitelist',
        isHidden: false,
        price: new BigNumber('2.345'),
        diff24h: '+1.23%'
    } satisfies MultichainWalletAsset);

/** The loading mockup runs the list past the fold — ten rows, not a screenful. */
const PLACEHOLDER_ROW_COUNT = 10;

export const PLACEHOLDER_ASSETS: MultichainWalletAsset[] = Array.from(
    { length: PLACEHOLDER_ROW_COUNT },
    (_, index) => placeholderAsset(index)
);

export const PLACEHOLDER_WALLET_ASSETS = {
    assets: PLACEHOLDER_ASSETS,
    totalFiat: new BigNumber('2345')
};

const placeholderCatalogAsset = (index: number) =>
    ({
        assetId: `placeholder/evm/token/${index}`,
        assetType: 'asset',
        symbol: 'TOKEN',
        name: 'Placeholder',
        decimals: 9,
        image: '',
        isScam: false,
        verification: 'none',
        trustScore: 0,
        price: '2.345',
        change24hPercent: '+1.23'
    } satisfies TradingMarketAsset);

export const PLACEHOLDER_CATALOG_ASSETS: TradingMarketAsset[] = Array.from(
    { length: PLACEHOLDER_ROW_COUNT },
    (_, index) => placeholderCatalogAsset(index)
);

/**
 * Two stand-in shelf groups for the Trade tab: one chain, one shelf, eight
 * grid cells each — the mockup's two visible sections of 4 × 2 masked cells.
 * A single "All" chain keeps the group from rendering any chain control of
 * its own; the header paints the standard bar instead.
 */
export const PLACEHOLDER_SHELF_GROUPS: TradingShelfGroup[] = Array.from(
    { length: 2 },
    (_, groupIndex) => ({
        id: `placeholder-${groupIndex}`,
        name: 'Placeholder',
        chains: [
            {
                chain: 'All',
                shelves: [
                    {
                        key: 'core',
                        title: 'Placeholder',
                        type: 'grid',
                        source: 'placeholder',
                        seeAll: { enabled: false, route: 'all' },
                        items: PLACEHOLDER_CATALOG_ASSETS.slice(0, 8)
                    }
                ]
            }
        ]
    })
);

/** Single-asset stand-in for the asset page while the wallet assets load. */
export const PLACEHOLDER_ASSET: MultichainWalletAsset = placeholderAsset(0);

/**
 * `MultichainHistoryRow` swaps to a fixed masked cell inside a loading scope,
 * so only the identity fields (list key, chain) are ever read from these.
 */
const placeholderActivity = (index: number) =>
    ({
        activityType: 'send',
        status: 'confirmed',
        blockTimeMs: 0,
        fromChain: 'eth',
        toChain: 'eth',
        direction: 'out',
        txIds: [`placeholder:${index}`]
    } satisfies MultichainActivity);

export const PLACEHOLDER_ACTIVITIES: MultichainActivity[] = Array.from(
    { length: PLACEHOLDER_ROW_COUNT },
    (_, index) => placeholderActivity(index)
);

/**
 * Grid stand-ins for the collectibles screens. `NftCardSmall` masks every
 * visible field inside a loading scope, so only the identity fields matter.
 */
const placeholderNft = (index: number) =>
    ({
        address: `placeholder-nft-${index}`,
        index,
        verified: false,
        metadata: { name: 'Placeholder' },
        approvedBy: [],
        trust: 'none'
    } satisfies NFT);

export const PLACEHOLDER_NFTS: NFT[] = Array.from({ length: 9 }, (_, index) =>
    placeholderNft(index)
);

/**
 * Explore-tab stand-ins: an untitled services row plus two titled category
 * sections of two 4-card rows — the loaded page's shape with every card
 * masked. No loading mockup exists for the browser; this follows the
 * vocabulary of the data screens.
 */
const placeholderBrowserApp = (index: number) =>
    ({
        id: `placeholder-${index}`,
        name: 'App',
        description: 'Placeholder description',
        url: '',
        icon: '',
        chains: []
    } satisfies BrowserApp);

export const PLACEHOLDER_BROWSER_APPS: BrowserApp[] = Array.from({ length: 8 }, (_, index) =>
    placeholderBrowserApp(index)
);

export const PLACEHOLDER_BROWSER_CATEGORIES: BrowserCategory[] = Array.from(
    { length: 2 },
    (_, index) => ({
        id: `placeholder-category-${index}`,
        title: 'Placeholder',
        apps: PLACEHOLDER_BROWSER_APPS
    })
);
