import { test, expect } from '@playwright/test';

//TON Connect

test('TON Connect', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .locator('div')
        .filter({ hasText: /^Password$/ })
        .getByRole('textbox')
        .fill('123456');
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill('123456');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByText('Discover').click();
    const page1Promise = page.waitForEvent('popup');
    await page.locator('div:nth-child(4) > .sc-dxeFTI > div > .sc-bcKLde').first().click();
    const page1 = await page1Promise;
    await page.getByText('STON.fi').nth(2).click();
    await page1.getByRole('button', { name: 'Connect wallet' }).click();
    await page1.getByRole('button', { name: 'Tonkeeper Popular' }).click();
    await page1.locator('.go1369062826').first().click();
    await page.goto(
        'https://app.tonkeeper.com/ton-connect?v=2&id=9c251162746584e1160d0c827e5ca9b182e3db0c901ae980e1cda70f18666a3b&r=%7B%22manifestUrl%22%3A%22https%3A%2F%2Fapp.ston.fi%2Ftonconnect-manifest.json%22%2C%22items%22%3A%5B%7B%22name%22%3A%22ton_addr%22%7D%5D%7D&ret=none'
    );
    // TODO: this test is not working as soon as follow link will navigate to production wallet.tonkeeper.com, instead of testing version
    await page.getByRole('link', { name: 'Sign in with Tonkeeper Web' }).click();
    await page.getByRole('button', { name: 'Connect wallet' }).click();
});
