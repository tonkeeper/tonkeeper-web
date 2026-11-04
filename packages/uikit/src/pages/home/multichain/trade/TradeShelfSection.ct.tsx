import { TradingMarketAsset, TradingShelfGroup } from '@tonkeeper/core/dist/service/tradingService';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { TradeShelfSection } from './TradeShelfSection';
import { TradeShelfSectionRemountStory } from './TradeShelfSectionStory';

// Edge cases the screenshot suite targets:
//   - multi-shelf chain renders the segmented toggle; single-shelf doesn't.
//   - multi-chain group renders the network dropdown; single-chain doesn't.
//   - a 6-item shelf fills rows of four, padding the trailing row so cells
//     keep their column width.

const asset = (id: string, symbol: string, change: string): TradingMarketAsset => ({
    assetId: id,
    assetType: 'asset',
    symbol,
    name: symbol,
    decimals: 9,
    image: '',
    isScam: false,
    verification: 'whitelist' as const,
    trustScore: 95,
    change24hPercent: change
});

const shelf = (key: string, title: string, items: TradingMarketAsset[]) => ({
    key: key as 'top_gainers',
    title,
    type: 'grid' as const,
    source: 'dyor',
    seeAll: { enabled: true, route: 'all' as const },
    items
});

const multiShelfGroup: TradingShelfGroup = {
    id: 'top_movers',
    name: 'Today’s top movers',
    chains: [
        {
            chain: 'All',
            shelves: [
                shelf('top_gainers', 'Top Gainers', [
                    asset('ton/mainnet/coin', 'TON', '4.12'),
                    asset('eth/mainnet/coin', 'ETH', '1.87'),
                    asset('eth/mainnet/erc20/0xshib', 'SHIB', '0.54'),
                    asset('btc/mainnet/coin', 'BTC', '3.21')
                ]),
                shelf('top_losers', 'Top Losers', [asset('tron/mainnet/coin', 'TRX', '-2.98')])
            ]
        },
        {
            chain: 'Ethereum',
            shelves: [
                shelf('top_gainers', 'Top Gainers', [
                    asset('eth/mainnet/erc20/0xaave', 'AAVE', '3.21')
                ])
            ]
        }
    ]
};

const singleShelfGroup: TradingShelfGroup = {
    id: 'commodities',
    name: 'Commodities',
    chains: [
        {
            chain: 'All',
            shelves: [
                shelf('core', 'Commodities', [
                    asset('eth/mainnet/erc20/0xxaut', 'XAUt', '0.52'),
                    asset('eth/mainnet/erc20/0xpaxg', 'PAXG', '-0.02'),
                    asset('eth/mainnet/erc20/0xkag', 'KAG', '1.68'),
                    asset('eth/mainnet/erc20/0xusdoil', 'USDOil', '0.70'),
                    asset('eth/mainnet/erc20/0xwsteth', 'wstETH', '2.09'),
                    asset('eth/mainnet/erc20/0xreth', 'rETH', '-1.01')
                ])
            ]
        }
    ]
};

screenshot('TradeShelfSection multi shelf with network dropdown', () => (
    <div className="w-[390px] bg-backgroundPage px-4 py-2">
        <TradeShelfSection group={multiShelfGroup} onSeeAll={() => {}} />
    </div>
));

screenshot('TradeShelfSection single shelf six items pads last row', () => (
    <div className="w-[390px] bg-backgroundPage px-4 py-2">
        <TradeShelfSection group={singleShelfGroup} />
    </div>
));

const namedChainGroup: TradingShelfGroup = {
    id: 'rwa',
    name: 'Stocks & ETFs',
    chains: [
        {
            chain: 'Solana',
            shelves: [shelf('rwa', 'Stocks', [asset('sol/mainnet/token/tsla', 'TSLAx', '1.32')])]
        }
    ]
};

test('TradeShelfSection single named chain shows no chain control', async ({ mount }) => {
    const c = await mount(
        <div className="w-[390px] bg-backgroundPage px-4 py-2">
            <TradeShelfSection group={namedChainGroup} />
        </div>
    );
    await expect(c.getByText('TSLAx')).toBeVisible();
    await expect(c.getByText('Solana')).toHaveCount(0);
});

test('TradeShelfSection switches shelves via the segmented control', async ({ mount }) => {
    const c = await mount(
        <div className="w-[390px] bg-backgroundPage px-4 py-2">
            <TradeShelfSection group={multiShelfGroup} />
        </div>
    );
    await expect(c.getByText('TON')).toBeVisible();
    await c.getByRole('tab', { name: 'Top Losers' }).click();
    await expect(c.getByText('TRX')).toBeVisible();
    await expect(c.getByText('TON')).not.toBeVisible();
});

test('TradeShelfSection switches chains via the network dropdown', async ({ mount }) => {
    const c = await mount(
        <div className="w-[390px] bg-backgroundPage px-4 py-2">
            <TradeShelfSection group={multiShelfGroup} />
        </div>
    );
    await c.getByRole('button', { name: /All/ }).click();
    await c.getByText('Ethereum').click();
    await expect(c.getByText('AAVE')).toBeVisible();
});

test('TradeShelfSection keeps the selected shelf across a remount', async ({ mount }) => {
    const c = await mount(<TradeShelfSectionRemountStory group={multiShelfGroup} />);
    await c.getByRole('tab', { name: 'Top Losers' }).click();
    await expect(c.getByText('TRX')).toBeVisible();
    await c.getByTestId('toggle-section').click();
    await expect(c.getByText('TRX')).not.toBeVisible();
    await c.getByTestId('toggle-section').click();
    await expect(c.getByText('TRX')).toBeVisible();
    await expect(c.getByText('TON')).not.toBeVisible();
});

test('TradeShelfSection see-all passes the active chain and shelf', async ({ mount }) => {
    let seen: { chain: string; shelfKey: string } | undefined;
    const c = await mount(
        <div className="w-[390px] bg-backgroundPage px-4 py-2">
            <TradeShelfSection
                group={multiShelfGroup}
                onSeeAll={({ chain, shelfKey }) => (seen = { chain, shelfKey })}
            />
        </div>
    );
    await c.getByRole('button', { name: 'Today’s top movers' }).click();
    expect(seen).toEqual({ chain: 'All', shelfKey: 'top_gainers' });
});
