import { readFile } from 'fs/promises';
import path from 'path';
import type { Page } from 'playwright-core';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { BrowserAppListCard, BrowserAppListRow } from './BrowserAppListRow';

// Edge cases the screenshot suite targets:
//   - the standard row: 44px icon with a chain badge ringed in the cell
//     surface, name over description, trailing chevron.
//   - a two-plus-line description → `line-clamp-2` engages, the row grows to
//     two text lines and no further.
//   - stacked rows inside the card get inset-style dividers between them.

const ICON = 'https://assets.tonkeeper.test/browser/app-icon.jpg';
const testAssetsDir = path.resolve(process.cwd(), '../../tests/playwright/test-assets');

const setupImageMock = async (page: Page) => {
    await page.route(ICON, async route => {
        await route.fulfill({
            status: 200,
            contentType: 'image/jpeg',
            body: await readFile(path.join(testAssetsDir, 'duck1.jpg'))
        });
    });
};

const WRAP = 'w-[358px] bg-backgroundPage p-2';

screenshot(
    'BrowserAppListRow single row',
    () => (
        <div className={WRAP}>
            <BrowserAppListCard>
                <BrowserAppListRow
                    app={{
                        name: 'Aave',
                        description: 'Fast fiat-to-crypto checkout',
                        icon: ICON,
                        chains: ['eth']
                    }}
                    onClick={() => {}}
                />
            </BrowserAppListCard>
        </div>
    ),
    'desktop',
    { setupPage: setupImageMock }
);

screenshot(
    'BrowserAppListRow long description clamps to two lines',
    () => (
        <div className={WRAP}>
            <BrowserAppListCard>
                <BrowserAppListRow
                    app={{
                        name: 'Compound',
                        description:
                            'Instantly buy TON, BTC with a credit card and a very long tail of extra words that must not render a third line under any circumstances',
                        icon: ICON,
                        chains: ['ton']
                    }}
                    onClick={() => {}}
                />
            </BrowserAppListCard>
        </div>
    ),
    'desktop',
    { setupPage: setupImageMock }
);

screenshot(
    'BrowserAppListRow stacked rows with dividers',
    () => (
        <div className={WRAP}>
            <BrowserAppListCard>
                <BrowserAppListRow
                    app={{ name: 'Aave', description: 'Lending', icon: ICON, chains: ['eth'] }}
                    onClick={() => {}}
                />
                <BrowserAppListRow
                    app={{ name: 'Morpho', description: 'Yield', icon: ICON, chains: [] }}
                    onClick={() => {}}
                />
            </BrowserAppListCard>
        </div>
    ),
    'desktop',
    { setupPage: setupImageMock }
);

test('clicking a row fires onClick', async ({ mount }) => {
    let clicked = false;
    const c = await mount(
        <BrowserAppListRow
            app={{ name: 'Aave', description: 'Lending', icon: ICON, chains: ['eth'] }}
            onClick={() => (clicked = true)}
        />
    );
    await c.click();
    expect(clicked).toBe(true);
});

test('a multi-network app renders no chain badge', async ({ mount }) => {
    const c = await mount(
        <BrowserAppListRow
            app={{ name: 'Ethena', description: 'Yield', icon: ICON, chains: ['ton', 'eth'] }}
            chevron={false}
            onClick={() => {}}
        />
    );
    await expect(c.locator('svg')).toHaveCount(0);
});

test('a single-network app renders its chain badge', async ({ mount }) => {
    const c = await mount(
        <BrowserAppListRow
            app={{ name: 'Aave', description: 'Lending', icon: ICON, chains: ['eth'] }}
            chevron={false}
            onClick={() => {}}
        />
    );
    await expect(c.locator('svg')).toHaveCount(1);
});
