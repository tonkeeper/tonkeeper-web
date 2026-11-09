import type { Page, TestInfo } from '@playwright/test';
import { expect, test } from '../fixtures';

/** Read-only: opens each screen on the saved QA wallets and records what failed. Nothing is signed. */

const MULTICHAIN_SCREENS = [
    '/multichain',
    '/multichain/history',
    '/multichain/collectibles',
    '/multichain/trade',
    '/multichain/staking',
    '/multichain/browser',
    '/multichain/settings'
];

const LEGACY_SCREENS = ['/', '/activity', '/purchases', '/browser', '/staking', '/settings'];

function watchFailures(page: Page): string[] {
    const failures: string[] = [];
    page.on('response', response => {
        if (response.status() >= 400) {
            failures.push(`${response.status()} ${response.request().method()} ${response.url()}`);
        }
    });
    page.on('requestfailed', request => {
        failures.push(`failed ${request.method()} ${request.url()} (${request.failure()?.errorText})`);
    });
    return failures;
}

async function shoot(page: Page, testInfo: TestInfo, name: string) {
    await page.waitForTimeout(2_500);
    await testInfo.attach(name, { body: await page.screenshot(), contentType: 'image/png' });
}

async function visit(page: Page, testInfo: TestInfo, screens: string[], prefix: string) {
    const broken: string[] = [];
    for (const screen of screens) {
        await page.goto(screen);
        await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined);
        if (await page.getByText('Error Occurred').isVisible()) broken.push(screen);
        await shoot(page, testInfo, `${prefix}${screen.replace(/\//g, '_') || '_home'}`);
    }
    return broken;
}

async function openAndClose(page: Page, testInfo: TestInfo, button: string, name: string) {
    await page.getByRole('button', { name: button, exact: true }).first().click();
    await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 30_000 });
    await shoot(page, testInfo, name);
    await page.keyboard.press('Escape');
}

test('multichain wallet A: screens, send and receive sheets', async ({ walletA }, testInfo) => {
    const failures = watchFailures(walletA);
    const broken = await visit(walletA, testInfo, MULTICHAIN_SCREENS, 'A');
    await walletA.goto('/multichain');
    await openAndClose(walletA, testInfo, 'Send', 'A-send-sheet');
    await openAndClose(walletA, testInfo, 'Add Funds', 'A-add-funds-sheet');
    await testInfo.attach('A-summary', {
        body: [`origin: ${new URL(walletA.url()).origin}`, `error screens: ${broken.join(', ') || 'none'}`, '', ...failures].join('\n'),
        contentType: 'text/plain'
    });
    expect(broken).toEqual([]);
});

test('legacy wallet B: screens', async ({ walletB }, testInfo) => {
    const failures = watchFailures(walletB);
    const broken = await visit(walletB, testInfo, LEGACY_SCREENS, 'B');
    await testInfo.attach('B-summary', {
        body: [`origin: ${new URL(walletB.url()).origin}`, `error screens: ${broken.join(', ') || 'none'}`, '', ...failures].join('\n'),
        contentType: 'text/plain'
    });
    expect(broken).toEqual([]);
});
