import { readFile } from 'fs/promises';
import path from 'path';
import type { Page } from 'playwright-core';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { BrowserServiceCard } from './BrowserServiceCard';

// Edge cases the screenshot suite targets:
//   - chain badge overlays the thumb's bottom-right corner, ringed in the
//     page background; a chain-agnostic app renders no badge at all.
//   - long app name → single-line `truncate` inside the 88px card, no wrap.

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

const WRAP = 'w-[120px] bg-backgroundPage p-2';

screenshot(
    'BrowserServiceCard with chain badge',
    () => (
        <div className={WRAP}>
            <BrowserServiceCard
                app={{ name: 'GetGems', icon: ICON, chains: ['ton'] }}
                onClick={() => {}}
            />
        </div>
    ),
    'desktop',
    { setupPage: setupImageMock }
);

screenshot(
    'BrowserServiceCard chain-agnostic without badge',
    () => (
        <div className={WRAP}>
            <BrowserServiceCard
                app={{ name: 'Gift Cards', icon: ICON, chains: [] }}
                onClick={() => {}}
            />
        </div>
    ),
    'desktop',
    { setupPage: setupImageMock }
);

screenshot(
    'BrowserServiceCard long name truncates',
    () => (
        <div className={WRAP}>
            <BrowserServiceCard
                app={{ name: 'An Unreasonably Long dApp Name', icon: ICON, chains: ['eth'] }}
                onClick={() => {}}
            />
        </div>
    ),
    'desktop',
    { setupPage: setupImageMock }
);

test('clicking the card fires onClick', async ({ mount }) => {
    let clicked = false;
    const c = await mount(
        <BrowserServiceCard
            app={{ name: 'GetGems', icon: ICON, chains: ['ton'] }}
            onClick={() => (clicked = true)}
        />
    );
    await c.click();
    expect(clicked).toBe(true);
});
