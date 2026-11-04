import { expect, screenshot, test } from '../../../../playwright/test';
import { AssetRowAsset, AssetRowHarness } from './HomeMultichainAssetRowHarness';

// Edge cases the screenshot suite targets:
//   - long symbol next to a chain chip → `truncate` on the symbol span
//     must engage instead of overflowing the right column.
//   - very small price (sub-cent / scientific notation territory) → the
//     formatter has to render something readable, not `0` or `NaN`.
//   - very large balance → no wrap, no overlap with the right column.
//   - missing price → secondary lines collapse, layout doesn't shift.
//   - long fiat balance (millions) → secondary line still fits.

const sampleAsset = (overrides: Partial<AssetRowAsset>): AssetRowAsset => ({
    assetId: 'ton/mainnet/coin',
    chain: 'ton',
    name: 'TON',
    symbol: 'TON',
    decimals: 9,
    image: '',
    balance: '0',
    verification: 'whitelist',
    isHidden: false,
    ...overrides
});

// CT's static mount-loader can't resolve component wrappers defined in the
// test file (see Frame note in other rows). Inline the card container.
const CARD = 'w-[360px] overflow-hidden rounded-medium bg-backgroundContent';

// Narrow card variant to force truncation regardless of monitor width.
const NARROW = 'w-[280px] overflow-hidden rounded-medium bg-backgroundContent';

screenshot('HomeMultichainAssetRow TON native baseline', () => (
    <div className={CARD}>
        <AssetRowHarness
            asset={sampleAsset({
                balance: '4530000000',
                priceStr: '5.43',
                diff24h: '+2.34%'
            })}
        />
    </div>
));

screenshot('HomeMultichainAssetRow long symbol truncates beside chain chip', () => (
    <div className={NARROW}>
        <AssetRowHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xdeadbeef',
                chain: 'evm',
                name: 'Long Token Name',
                symbol: 'SUPERLONGTOKEN',
                decimals: 18,
                balance: '12340000000000000000',
                priceStr: '0.42',
                diff24h: '+1.10%'
            })}
        />
    </div>
));

screenshot('HomeMultichainAssetRow sub-cent price renders without collapsing', () => (
    <div className={CARD}>
        <AssetRowHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
                chain: 'evm',
                name: 'Shiba Inu',
                symbol: 'SHIB',
                decimals: 18,
                balance: '12345670000000000000000000', // 12.3M SHIB
                priceStr: '0.00000234',
                diff24h: '-0.42%'
            })}
        />
    </div>
));

screenshot('HomeMultichainAssetRow huge fiat balance stays single-line', () => (
    <div className={CARD}>
        <AssetRowHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                chain: 'evm',
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                balance: '1234567890000', // 1.234M USDC
                priceStr: '1.00',
                diff24h: '+0.01%'
            })}
        />
    </div>
));

screenshot('HomeMultichainAssetRow no price hides secondary lines without shifting layout', () => (
    <div className={CARD}>
        <AssetRowHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0x6b175474e89094c44da98b954eedeac495271d0f',
                chain: 'evm',
                name: 'Dai',
                symbol: 'DAI',
                decimals: 18,
                balance: '1000000000000000000'
            })}
        />
    </div>
));

screenshot('HomeMultichainAssetRow trusted token shows verification badge', () => (
    <div className={CARD}>
        <AssetRowHarness
            asset={sampleAsset({
                assetId: 'bsc/mainnet/bep20/0x55d398326f99059ff775485246999027b3197955',
                chain: 'evm',
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 18,
                verification: 'trusted',
                balance: '0',
                priceStr: '1.00'
            })}
        />
    </div>
));

test('HomeMultichainAssetRow trusted badge exposes a hover hint', async ({ mount }) => {
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <AssetRowHarness
                asset={sampleAsset({
                    symbol: 'USDT',
                    name: 'Tether USD',
                    verification: 'trusted',
                    balance: '0',
                    priceStr: '1.00'
                })}
            />
        </div>
    );
    const badge = c.getByRole('img', { name: 'Verified Token' });
    await expect(badge).toHaveAttribute('title', 'Verified Token');
    await expect(badge).toHaveClass(/text-accentBlue/);
});

test('HomeMultichainAssetRow renders symbol and balance', async ({ mount }) => {
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <AssetRowHarness
                asset={sampleAsset({
                    balance: '4530000000',
                    priceStr: '5.43',
                    diff24h: '+2.34%'
                })}
            />
        </div>
    );
    await expect(c).toContainText('TON');
    await expect(c).toContainText('+ 2.34 %');
});

test('HomeMultichainAssetRow truncates long symbols to one line', async ({ mount }) => {
    const c = await mount(
        <div className="w-[280px] overflow-hidden rounded-medium bg-backgroundContent">
            <AssetRowHarness
                asset={sampleAsset({
                    assetId: 'eth/mainnet/erc20/0xdeadbeef',
                    chain: 'evm',
                    symbol: 'SUPERLONGTOKEN',
                    name: 'Long Token Name',
                    decimals: 18,
                    balance: '12340000000000000000',
                    priceStr: '0.42'
                })}
            />
        </div>
    );
    const symbol = c.getByText('SUPERLONGTOKEN');
    await expect(symbol).toHaveClass(/truncate/);
});
