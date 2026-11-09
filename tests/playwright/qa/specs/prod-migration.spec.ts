import type { Locator, Page, TestInfo } from '@playwright/test';
import fs from 'fs';
import { appears, authFile, expect, test, walletPassword } from '../fixtures';

/** Signs nothing: moves the saved QA wallet B from the old origin to the new one and checks both ends. */

const OLD = 'https://wallet.tonkeeper.com';
const NEW = 'https://web.keeperwallet.com';

async function shoot(page: Page, testInfo: TestInfo, name: string) {
    await page.waitForTimeout(1_500);
    await testInfo.attach(name, { body: await page.screenshot(), contentType: 'image/png' });
}

async function clickIfShown(target: Locator, timeout = 10_000) {
    if (await appears(target, timeout)) {
        await target.click();
        return true;
    }
    return false;
}

test('old origin with wallets: move to the new origin', async ({ browser }, testInfo) => {
    // The shared fixture seeds every origin; here only the old one may hold the wallet.
    const { origins = [] } = JSON.parse(fs.readFileSync(authFile('B'), 'utf8')) as {
        origins?: { localStorage: { name: string; value: string }[] }[];
    };
    const context = await browser.newContext({
        recordVideo: { dir: testInfo.outputPath('video-migration') }
    });
    await context.addInitScript(
        ({ entries, oldOrigin }) => {
            if (location.origin !== oldOrigin) return;
            if (localStorage.getItem('tonkeeper_active_account_id') !== null) return;
            for (const { name, value } of entries) localStorage.setItem(name, value);
        },
        { entries: origins.flatMap(o => o.localStorage), oldOrigin: OLD }
    );
    const old = await context.newPage();
    await old.goto(OLD);
    const steps: string[] = [];

    await expect(old.getByText('Tonkeeper Web has moved')).toBeVisible({ timeout: 30_000 });
    await shoot(old, testInfo, '1-old-we-moved');

    await old.getByRole('link', { name: 'Move my wallets' }).click();
    await old.waitForURL(url => url.origin === NEW, { timeout: 30_000 });
    steps.push(`new origin opened: ${old.url()}`);
    steps.push(`new origin wallets before: ${await old.evaluate(() => localStorage.getItem('tonkeeper_active_account_id') ?? 'none')}`);
    await shoot(old, testInfo, '2-new-offer');

    const popupPromise = old.context().waitForEvent('page', { timeout: 30_000 });
    await old.getByRole('button', { name: 'Move my wallets' }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    steps.push(`popup: ${popup.url()}`);
    await shoot(popup, testInfo, '3-popup');

    if (await clickIfShown(popup.getByRole('button', { name: /^Move wallets?$/ }), 30_000)) {
        steps.push('popup: consent given');
    }
    const password = popup.getByPlaceholder('Password');
    if (await appears(password, 10_000)) {
        await password.fill(walletPassword());
        await popup.getByRole('button', { name: /^(Continue|Confirm|Move wallets?)$/ }).first().click();
        steps.push('popup: password entered');
    }
    // The popup closes itself once the wallets are sent; the "on their way" screen is its fallback.
    const sent = popup.getByText('Your wallets are on their way');
    await Promise.race([
        popup.waitForEvent('close', { timeout: 60_000 }),
        sent.waitFor({ timeout: 60_000 })
    ]);
    steps.push(`popup: ${popup.isClosed() ? 'closed itself' : 'shows sent screen'}`);
    await popup.close().catch(() => undefined);

    await shoot(old, testInfo, '5-new-confirm');
    if (await clickIfShown(old.getByRole('button', { name: /^Add wallets?$/ }), 30_000)) {
        steps.push('new origin: add confirmed');
    }
    const newPassword = old.locator('#create-password');
    if (await appears(newPassword, 10_000)) {
        await newPassword.fill(walletPassword());
        await old.locator('#create-password-confirm').fill(walletPassword());
        await old.getByRole('button', { name: 'Continue' }).click();
        steps.push('new origin: password set');
    }
    await expect
        .poll(() => old.evaluate(() => localStorage.getItem('tonkeeper_active_account_id')), {
            timeout: 60_000
        })
        .not.toBeNull();
    await old.waitForTimeout(5_000);
    await shoot(old, testInfo, '6-new-home');
    steps.push(`ended on: ${old.url()}`);
    await testInfo.attach('steps', { body: steps.join('\n'), contentType: 'text/plain' });
    expect(new URL(old.url()).origin).toBe(NEW);
    await context.close();
});

test('old origin, empty profile: goes to the new origin', async ({ browser }, testInfo) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(OLD);
    await page.waitForURL(url => url.origin === NEW, { timeout: 30_000 });
    await shoot(page, testInfo, 'empty-old');
    await context.close();
});

test('new origin, empty profile: asks the old origin once, then onboarding', async ({ browser }, testInfo) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const visited: string[] = [];
    page.on('framenavigated', f => f === page.mainFrame() && visited.push(f.url()));
    await page.goto(NEW);
    await expect(page.getByRole('button', { name: 'Import Existing Wallet' })).toBeVisible({
        timeout: 60_000
    });
    expect(new URL(page.url()).origin).toBe(NEW);
    await shoot(page, testInfo, 'empty-new');
    await testInfo.attach('navigations', { body: visited.join('\n'), contentType: 'text/plain' });
    await context.close();
});
