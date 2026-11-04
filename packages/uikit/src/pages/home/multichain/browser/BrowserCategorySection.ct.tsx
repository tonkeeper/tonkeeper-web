import { readFile } from 'fs/promises';
import path from 'path';
import type { Page } from 'playwright-core';

import { BrowserApp } from '@tonkeeper/core/dist/service/browserCatalogService';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { BrowserCategorySection } from './BrowserCategorySection';

// Edge cases the screenshot suite targets:
//   - a full row of four cards under the List Title + accent "See All".
//   - five apps → the under-filled second row is suppressed (four cards
//     render, the fifth hides behind "See All").
//   - eight-plus apps → exactly two rows render.
//   - the desktop column lays apps out five per row; slicing follows that
//     track so a five-app category fills the first row.

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

const app = (id: string): BrowserApp => ({
    id,
    name: id,
    description: `${id} description`,
    url: `https://${id}.example`,
    icon: ICON,
    chains: ['ton']
});

const apps = (count: number) => Array.from({ length: count }, (_, i) => app(`App ${i + 1}`));

const category = (count: number) => ({ id: 'lending', title: 'Lending', apps: apps(count) });

const WRAP = 'w-[390px] bg-backgroundPage px-4 py-2';

screenshot(
    'BrowserCategorySection one row',
    () => (
        <div className={WRAP}>
            <BrowserCategorySection
                category={category(4)}
                onSeeAll={() => {}}
                onOpenApp={() => {}}
            />
        </div>
    ),
    'desktop',
    { setupPage: setupImageMock }
);

screenshot(
    'BrowserCategorySection suppresses under-filled second row',
    () => (
        <div className={WRAP}>
            <BrowserCategorySection
                category={category(5)}
                onSeeAll={() => {}}
                onOpenApp={() => {}}
            />
        </div>
    ),
    'desktop',
    { setupPage: setupImageMock }
);

screenshot(
    'BrowserCategorySection caps at two rows',
    () => (
        <div className={WRAP}>
            <BrowserCategorySection
                category={category(12)}
                onSeeAll={() => {}}
                onOpenApp={() => {}}
            />
        </div>
    ),
    'desktop',
    { setupPage: setupImageMock }
);

screenshot(
    'BrowserCategorySection desktop five per row',
    () => (
        <div className="w-[520px] bg-backgroundPage px-4 py-2">
            <BrowserCategorySection
                category={category(8)}
                compact
                onSeeAll={() => {}}
                onOpenApp={() => {}}
            />
        </div>
    ),
    'desktop',
    { setupPage: setupImageMock }
);

test('See All fires its callback', async ({ mount }) => {
    let seeAll = false;
    const c = await mount(
        <BrowserCategorySection
            category={category(6)}
            onSeeAll={() => (seeAll = true)}
            onOpenApp={() => {}}
        />
    );
    await c.getByRole('button', { name: 'See All' }).click();
    expect(seeAll).toBe(true);
});

test('tapping a card opens that app', async ({ mount }) => {
    let opened: BrowserApp | undefined;
    const c = await mount(
        <BrowserCategorySection
            category={category(4)}
            onSeeAll={() => {}}
            onOpenApp={a => (opened = a)}
        />
    );
    await c.getByRole('button', { name: 'App 2' }).click();
    expect(opened?.id).toBe('App 2');
});

test('desktop keeps five apps on one row', async ({ mount }) => {
    const c = await mount(
        <BrowserCategorySection
            category={category(5)}
            compact
            onSeeAll={() => {}}
            onOpenApp={() => {}}
        />
    );
    expect(await c.getByRole('button', { name: /^App / }).count()).toBe(5);
});

test('desktop caps at two rows of five', async ({ mount }) => {
    const c = await mount(
        <BrowserCategorySection
            category={category(12)}
            compact
            onSeeAll={() => {}}
            onOpenApp={() => {}}
        />
    );
    expect(await c.getByRole('button', { name: /^App / }).count()).toBe(10);
});
