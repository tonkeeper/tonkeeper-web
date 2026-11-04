import { expect, screenshot, test } from '../../../../../playwright/test';
import { HeroAsset, HeroHarness } from './MultichainAssetHeroHarness';

// Edge cases the screenshot suite targets:
//   - native coin → no chain badge overlay on the icon.
//   - non-native (ERC20/TRC20) → small chain badge sits bottom-right of
//     the icon, NOT floated to the row's right edge (a flex-column
//     `align-items: stretch` regression we just fixed).
//   - sub-cent price → formatter renders meaningful precision rather
//     than collapsing to "$ 0".
//   - large positive diff → green; negative diff → red; missing price
//     → em-dash placeholder, layout doesn't collapse.
//   - a loaded chart window replaces the 24h line with that period's
//     change and label; while the first window loads the line is a bar.

const sampleAsset = (overrides: Partial<HeroAsset>): HeroAsset => ({
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

const FRAME = 'w-[390px] bg-backgroundPage';

screenshot('MultichainAssetHero TON native with positive diff', () => (
    <div className={FRAME}>
        <HeroHarness asset={sampleAsset({ priceStr: '5.43', diff24h: '+2.34%' })} />
    </div>
));

screenshot('MultichainAssetHero TRC20 USDT chain badge pinned to icon', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({
                assetId: 'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                chain: 'tron',
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
                priceStr: '0.999',
                diff24h: '-0.02%'
            })}
        />
    </div>
));

screenshot('MultichainAssetHero sub-cent price formatted with precision', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
                chain: 'evm',
                name: 'Shiba Inu',
                symbol: 'SHIB',
                decimals: 18,
                priceStr: '0.00000234',
                diff24h: '-1.20%'
            })}
        />
    </div>
));

screenshot('MultichainAssetHero multi-digit positive diff still fits', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xc0ffee',
                chain: 'evm',
                name: 'Moonshot',
                symbol: 'MOON',
                decimals: 18,
                priceStr: '1234.56',
                diff24h: '+9876.54%'
            })}
        />
    </div>
));

// 2026-07-05T21:00:00Z — a fixed instant so the scrub date renders stably.
screenshot('MultichainAssetHero scrub readout replaces the 24h line', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({ priceStr: '1.62', diff24h: '+2%' })}
            scrub={{
                timestamp: 1751749200,
                price: 1.76,
                diffPercent: 4.5,
                diffFiat: 0.0761
            }}
        />
    </div>
));

screenshot('MultichainAssetHero scrub with negative diff', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({ priceStr: '1.62', diff24h: '+2%' })}
            scrub={{
                timestamp: 1751749200,
                price: 1.56,
                diffPercent: -3.12,
                diffFiat: -0.0503
            }}
        />
    </div>
));

screenshot('MultichainAssetHero no price falls back to em-dash', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0x6b175474e89094c44da98b954eedeac495271d0f',
                chain: 'evm',
                name: 'Dai',
                symbol: 'DAI',
                decimals: 18
            })}
        />
    </div>
));

screenshot('MultichainAssetHero period change replaces the 24h line', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({ priceStr: '1.62', diff24h: '+2%' })}
            periodChange={{ period: 'M', price: 1.846, diffPercent: 7.32, diffFiat: 0.126 }}
        />
    </div>
));

screenshot('MultichainAssetHero negative period change', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({ priceStr: '1.62', diff24h: '+2%' })}
            periodChange={{ period: 'H', price: 1.6, diffPercent: -0.62, diffFiat: -0.01 }}
        />
    </div>
));

screenshot('MultichainAssetHero period change loading bar', () => (
    <div className={FRAME}>
        <HeroHarness
            asset={sampleAsset({ priceStr: '1.62', diff24h: '+2%' })}
            periodChangeLoading
        />
    </div>
));

const PERIOD_LABELS = [
    ['H', 'Last hour'],
    ['D', 'Last day'],
    ['W', 'Last week'],
    ['M', 'Last month'],
    ['6M', 'Last 6 months'],
    ['Y', 'Last year']
] as const;

for (const [period, label] of PERIOD_LABELS) {
    test(`MultichainAssetHero labels the ${period} period change "${label}"`, async ({ mount }) => {
        const component = await mount(
            <HeroHarness
                asset={sampleAsset({ priceStr: '1.62', diff24h: '+2%' })}
                periodChange={{ period, price: 1.846, diffPercent: 7.32, diffFiat: 0.126 }}
            />
        );
        await expect(component.getByText(label, { exact: true })).toBeVisible();
        await expect(component.getByText('24h', { exact: true })).toHaveCount(0);
    });
}

test('MultichainAssetHero period change shows the window move and closing price', async ({
    mount
}) => {
    const component = await mount(
        <HeroHarness
            asset={sampleAsset({ priceStr: '1.62', diff24h: '+2%' })}
            periodChange={{ period: 'W', price: 2.5, diffPercent: -12.5, diffFiat: -0.25 }}
        />
    );
    await expect(component.getByText('- 12.5 %', { exact: true })).toBeVisible();
    await expect(component.getByText(/0[.,]25/)).toBeVisible();
    const headline = component.locator('.text-h2');
    await expect(headline).toHaveText(/2[.,]50?$/);
    await expect(headline).not.toHaveText(/1[.,]62/);
    await expect(component.getByText('+ 2 %', { exact: true })).toHaveCount(0);
});

test('MultichainAssetHero scrub readout wins over the period change', async ({ mount }) => {
    const component = await mount(
        <HeroHarness
            asset={sampleAsset({ priceStr: '1.62', diff24h: '+2%' })}
            periodChange={{ period: 'M', price: 1.846, diffPercent: 7.32, diffFiat: 0.126 }}
            scrub={{ timestamp: 1751749200, price: 1.76, diffPercent: 4.5, diffFiat: 0.0761 }}
        />
    );
    await expect(component.getByText('+ 4.5 %', { exact: true })).toBeVisible();
    await expect(component.getByText('Last month', { exact: true })).toHaveCount(0);
});

test('MultichainAssetHero falls back to the 24h change without a chart window', async ({
    mount
}) => {
    const component = await mount(
        <HeroHarness asset={sampleAsset({ priceStr: '1.62', diff24h: '+2%' })} />
    );
    await expect(component.getByText('+ 2 %', { exact: true })).toBeVisible();
    await expect(component.getByText('24h', { exact: true })).toBeVisible();
});

test('MultichainAssetHero masks the change line while the first window loads', async ({
    mount
}) => {
    const component = await mount(
        <HeroHarness
            asset={sampleAsset({ priceStr: '1.62', diff24h: '+2%' })}
            periodChangeLoading
        />
    );
    await expect(component.locator('[data-skeleton]')).toHaveCount(1);
    await expect(component.getByText('24h', { exact: true })).toHaveCount(0);
});
