import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../fixtures';

/**
 * Read-only: Perps Home on the multichain wallet A. Nothing is signed. Perps is
 * switched on through the dev settings, so the spec does not depend on the boot
 * config's `perps_enabled`.
 */

const PERPS = '/multichain/perps';
const DEV_SETTINGS_KEY = 'tonkeeper_dev_settings';

/** tk-perps, the trading catalog and Hermes; kandelabr is left out until the chart uses it. */
const PERPS_BACKEND = /\/(tk-perps|trading|hermes)\//;

async function setPerpsDevFlag(page: Page, perpsEnabled: boolean) {
    await page.evaluate(
        ({ key, perpsEnabled }) => {
            const stored = JSON.parse(localStorage.getItem(key) ?? '{}')?.payload ?? {};
            localStorage.setItem(key, JSON.stringify({ payload: { ...stored, perpsEnabled } }));
        },
        { key: DEV_SETTINGS_KEY, perpsEnabled }
    );
}

function watchPerpsBackend(page: Page): string[] {
    const failures: string[] = [];
    page.on('response', response => {
        if (response.status() >= 400 && PERPS_BACKEND.test(response.url())) {
            const url = new URL(response.url());
            failures.push(
                `${response.status()} ${response.request().method()} ${url.origin}${url.pathname}`
            );
        }
    });
    // A CORS refusal shows up as a failed request, not as a status.
    page.on('requestfailed', request => {
        if (PERPS_BACKEND.test(request.url())) {
            const url = new URL(request.url());
            failures.push(
                `failed ${request.method()} ${url.origin}${url.pathname} (${
                    request.failure()?.errorText
                })`
            );
        }
    });
    return failures;
}

/** Market rows are the buttons whose subtitle is the 24h volume. */
const marketRows = (page: Page): Locator => page.getByRole('button').filter({ hasText: / vol\b/ });

const rowSymbols = (rows: Locator) =>
    rows.evaluateAll(els => els.map(el => el.querySelector('span')?.textContent ?? ''));

test('perps home on wallet A: balance, markets, sort, live prices, paging', async ({
    walletA
}, testInfo) => {
    const page = walletA;
    const failures = watchPerpsBackend(page);

    await setPerpsDevFlag(page, true);
    await page.goto(PERPS);
    await expect(page).toHaveURL(new RegExp(`${PERPS}$`));
    await expect(page.getByText('Perpetuals', { exact: true })).toBeVisible();

    // Header and balance card controls show even before their flows exist.
    await expect(page.getByRole('button', { name: 'Learn Basics', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Perps History', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeVisible();
    await expect(page.getByText('Perps balance', { exact: true })).toBeVisible();

    // The account resolves: no masked bar is left and a deposit control is offered.
    await expect(page.locator('[data-skeleton]')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Deposit', exact: true }).first()).toBeVisible();

    const rows = marketRows(page);
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    const firstPage = await rows.count();
    expect(firstPage).toBeGreaterThan(5);
    await testInfo.attach('perps-home', {
        body: await page.screenshot(),
        contentType: 'image/png'
    });

    // Live mark prices: one of the top rows' price changes within half a minute.
    const prices = () => rows.evaluateAll(els => els.slice(0, 10).map(el => el.textContent));
    const before = await prices();
    await expect
        .poll(async () => JSON.stringify(await prices()) !== JSON.stringify(before), {
            timeout: 30_000,
            intervals: [1_000]
        })
        .toBe(true);

    // Paging: scrolling to the end loads the next page. The wheel, as a user scrolls: a jump
    // straight to the last row is not what the end-of-list observer is built for.
    await page.mouse.move(800, 400);
    await expect
        .poll(
            async () => {
                await page.mouse.wheel(0, 2_000);
                return rows.count();
            },
            { timeout: 15_000, intervals: [300] }
        )
        .toBeGreaterThan(firstPage);

    // Sort: each option re-fetches the list in its own order.
    const topSymbols = async () => (await rowSymbols(rows)).slice(0, 10).join();
    const byVolume = await topSymbols();
    await page.getByRole('button', { name: 'Volume', exact: true }).click();
    await page.getByRole('button', { name: 'Price Change', exact: true }).click();
    await expect.poll(topSymbols, { timeout: 15_000 }).not.toBe(byVolume);
    const byPriceChange = await topSymbols();
    await page.getByRole('button', { name: 'Price Change', exact: true }).click();
    await page.getByRole('button', { name: 'Open Interest', exact: true }).click();
    await expect.poll(topSymbols, { timeout: 15_000 }).not.toBe(byPriceChange);
    await testInfo.attach('perps-sorted', {
        body: await page.screenshot(),
        contentType: 'image/png'
    });

    // Search and a market row open their routes.
    await page.getByRole('button', { name: 'Search', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${PERPS}/search$`));
    await page.goBack();
    await rows.first().click();
    await expect(page).toHaveURL(new RegExp(`${PERPS}/market/\\d+$`));

    await testInfo.attach('perps-backend-failures', {
        body: failures.join('\n') || 'none',
        contentType: 'text/plain'
    });
    expect(failures).toEqual([]);
});

test('perps search on wallet A: query, category filter, not found', async ({
    walletA
}, testInfo) => {
    const page = walletA;
    const failures = watchPerpsBackend(page);

    await setPerpsDevFlag(page, true);
    await page.goto(`${PERPS}/search`);
    await expect(page.getByText('Explore Perps', { exact: true })).toBeVisible();
    const field = page.getByPlaceholder('Search by ticker or name');
    await expect(field).toBeFocused();

    const rows = marketRows(page);
    const topSymbols = async () => (await rowSymbols(rows)).slice(0, 10).join();
    await expect(page.getByText('All assets', { exact: true })).toBeVisible();
    await expect(rows.first()).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-skeleton]')).toHaveCount(0, { timeout: 15_000 });
    expect(await rows.count()).toBeGreaterThan(5);
    await expect(page.getByRole('button', { name: 'All', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true'
    );
    await expect(page.getByRole('button', { name: 'Volume', exact: true })).toBeVisible();
    const allAssets = await topSymbols();

    await field.fill('BTC');
    await expect(page.locator('[data-skeleton]')).toHaveCount(0, { timeout: 15_000 });
    await expect.poll(async () => (await rowSymbols(rows))[0], { timeout: 15_000 }).toBe('BTC');
    await testInfo.attach('perps-search-btc', {
        body: await page.screenshot(),
        contentType: 'image/png'
    });

    await field.fill('');
    await page.getByRole('button', { name: 'Stocks', exact: true }).click();
    await expect(page.getByText('Stocks', { exact: true }).last()).toBeVisible();
    // Placeholder rows mask the list while the filtered page loads.
    await expect(page.locator('[data-skeleton]')).toHaveCount(0, { timeout: 15_000 });
    expect(await topSymbols()).not.toBe(allAssets);
    await testInfo.attach('perps-search-stocks', {
        body: await page.screenshot(),
        contentType: 'image/png'
    });

    await field.fill('zzqqxx');
    await expect(page.getByText('Not Found', { exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('There were no results for ‘zzqqxx’.')).toBeVisible();
    await testInfo.attach('perps-search-empty', {
        body: await page.screenshot(),
        contentType: 'image/png'
    });

    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${PERPS}$`));

    await testInfo.attach('perps-backend-failures', {
        body: failures.join('\n') || 'none',
        contentType: 'text/plain'
    });
    expect(failures).toEqual([]);
});

test('perps gate on wallet A: switched off, the route lands on the wallet home', async ({
    walletA
}) => {
    await setPerpsDevFlag(walletA, false);
    await walletA.goto(PERPS);
    await expect(walletA).not.toHaveURL(new RegExp(PERPS));
});
