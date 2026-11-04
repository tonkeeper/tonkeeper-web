import { TradingMarketAsset } from '@tonkeeper/core/dist/service/tradingService';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { CryptoCatalogRow } from './CryptoCatalogRow';

// Edge cases the screenshot suite targets:
//   - diff direction drives the colour token (green vs red); no diff =
//     row collapses cleanly.
//   - the bare-decimal wire format ("-1.20", "0.50") renders with an
//     explicit sign and trailing " %".
//   - long symbol next to a chain chip → `truncate` must engage instead
//     of overflowing the right column with the price.
//   - row without price and without diff still lays out without
//     collapsing the centre column.

const sampleAsset = (overrides: Partial<TradingMarketAsset>): TradingMarketAsset => ({
    assetId: 'ton/mainnet/coin',
    assetType: 'asset',
    symbol: 'TON',
    name: 'Toncoin',
    decimals: 9,
    image: '',
    isScam: false,
    verification: 'whitelist' as const,
    trustScore: 95,
    ...overrides
});

const CARD = 'w-[360px] overflow-hidden rounded-medium bg-backgroundContent';
const NARROW = 'w-[280px] overflow-hidden rounded-medium bg-backgroundContent';

screenshot('CryptoCatalogRow native coin with positive diff', () => (
    <div className={CARD}>
        <CryptoCatalogRow
            asset={sampleAsset({
                price: '5.43',
                change24hPercent: '2.34'
            })}
        />
    </div>
));

screenshot('CryptoCatalogRow unverified token hides the badge', () => (
    <div className={CARD}>
        <CryptoCatalogRow
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xnew',
                symbol: 'NEW',
                name: 'Newcomer',
                verification: 'none',
                price: '0.10',
                change24hPercent: '12.5'
            })}
        />
    </div>
));

screenshot('CryptoCatalogRow token with negative diff', () => (
    <div className={CARD}>
        <CryptoCatalogRow
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
                symbol: 'SHIB',
                name: 'Shiba Inu',
                decimals: 18,
                price: '0.0000234',
                change24hPercent: '-1.20'
            })}
        />
    </div>
));

screenshot('CryptoCatalogRow no price and no diff', () => (
    <div className={CARD}>
        <CryptoCatalogRow
            asset={sampleAsset({
                assetId: 'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                symbol: 'USDT',
                name: 'Tether USD',
                decimals: 6
            })}
        />
    </div>
));

screenshot('CryptoCatalogRow long symbol truncates beside chain chip', () => (
    <div className={NARROW}>
        <CryptoCatalogRow
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xdeadbeef',
                symbol: 'SUPERLONGTOKEN',
                name: 'Long Token',
                decimals: 18,
                price: '1.23',
                change24hPercent: '0.42'
            })}
        />
    </div>
));

test('CryptoCatalogRow tap calls onSelect before navigating', async ({ mount }) => {
    let selected = 0;
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <CryptoCatalogRow asset={sampleAsset({})} onSelect={() => selected++} />
        </div>
    );
    await c.getByRole('button').click();
    expect(selected).toBe(1);
});

test('CryptoCatalogRow negative diff uses the red accent and formats the sign', async ({
    mount
}) => {
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <CryptoCatalogRow
                asset={sampleAsset({
                    assetId: 'eth/mainnet/erc20/0xdeadbeef',
                    symbol: 'NEG',
                    price: '1.23',
                    change24hPercent: '-1.20'
                })}
            />
        </div>
    );
    await expect(c.getByText('- 1.2 %')).toHaveClass(/text-accentRed/);
});
