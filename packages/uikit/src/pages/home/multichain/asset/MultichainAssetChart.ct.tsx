import type { Locator, Page } from 'playwright-core';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { ChartHarness } from './MultichainAssetChartHarness';

// Edge cases:
//   - the line and its fill follow the window's direction: red when the
//     last price is below the first, green otherwise.
//   - the max / min price labels sit outside the plot, so an extreme at
//     either edge never runs underneath them.

const START = 1751328000;
const STEP = 3600;

const series = (prices: number[]) => prices.map((price, i) => [START + i * STEP, price]).reverse();

const RISING = series([1.2, 1.15, 1.3, 1.25, 1.42, 1.38, 1.55, 1.6]);
const FALLING = series([1.6, 1.62, 1.48, 1.5, 1.35, 1.39, 1.22, 1.2]);
const FLAT = series([1.4, 1.4, 1.4, 1.4]);

const mockCharts = (body: unknown) => async (page: Page) => {
    await page.route(/\/trading\/assets\/.+\/charts/, route => route.fulfill({ json: body }));
};

const curve = (component: Locator) => component.locator('.recharts-area-curve');

screenshot(
    'MultichainAssetChart rising window is green',
    () => <ChartHarness assetId="ton/mainnet/coin" period="M" />,
    'desktop',
    { setupPage: mockCharts(RISING) }
);

screenshot(
    'MultichainAssetChart falling window is red',
    () => <ChartHarness assetId="ton/mainnet/coin" period="M" />,
    'desktop',
    { setupPage: mockCharts(FALLING) }
);

test('MultichainAssetChart draws a falling window in red', async ({ mount, page }) => {
    await mockCharts(FALLING)(page);
    const component = await mount(<ChartHarness assetId="ton/mainnet/coin" period="W" />);
    await expect(curve(component)).toHaveAttribute('stroke', 'var(--tk-accent-red)');
});

test('MultichainAssetChart draws a rising window in green', async ({ mount, page }) => {
    await mockCharts(RISING)(page);
    const component = await mount(<ChartHarness assetId="ton/mainnet/coin" period="W" />);
    await expect(curve(component)).toHaveAttribute('stroke', 'var(--tk-accent-green)');
});

test('MultichainAssetChart draws a flat window in green', async ({ mount, page }) => {
    await mockCharts(FLAT)(page);
    const component = await mount(<ChartHarness assetId="ton/mainnet/coin" period="W" />);
    await expect(curve(component)).toHaveAttribute('stroke', 'var(--tk-accent-green)');
});

test('MultichainAssetChart keeps the price labels clear of the plot', async ({ mount, page }) => {
    await mockCharts(RISING)(page);
    const component = await mount(<ChartHarness assetId="ton/mainnet/coin" period="W" />);
    const plot = component.locator('svg.recharts-surface');
    await expect(plot).toBeVisible();

    const maxLabel = component.getByText(/1[.,]6/);
    const minLabel = component.getByText(/1[.,]15/);
    const [plotBox, maxBox, minBox] = await Promise.all([
        plot.boundingBox(),
        maxLabel.boundingBox(),
        minLabel.boundingBox()
    ]);
    expect(plotBox && maxBox && minBox).toBeTruthy();
    expect(maxBox!.y + maxBox!.height).toBeLessThanOrEqual(plotBox!.y);
    expect(minBox!.y).toBeGreaterThanOrEqual(plotBox!.y + plotBox!.height);
});
