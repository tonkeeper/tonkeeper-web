import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
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
    await page.locator('div:nth-child(5) > .sc-dxeFTI > div > .sc-bcKLde').first().click();
    const page1 = await page1Promise;
    await page.getByText('Getgems').nth(2).click();
    await page1.getByRole('button', { name: 'Connect Wallet' }).click();
    await page1.getByRole('button', { name: 'Tonkeeper Popular' }).click();
    await page1.locator('.go1369062826').first().click();
    await page.goto(
        'https://app.tonkeeper.com/ton-connect?v=2&id=29f2d58c1c8f4069ae394c99f62ab4ae7affd04a9fa1f3676e3cd13cd1ffe011&r=%7B%22manifestUrl%22%3A%22https%3A%2F%2Fgetgems.io%2Ftcm.json%22%2C%22items%22%3A%5B%7B%22name%22%3A%22ton_addr%22%7D%2C%7B%22name%22%3A%22ton_proof%22%2C%22payload%22%3A%22gems%22%7D%5D%7D&ret=none'
    );

    // TODO: this test is not working as soon as follow link will navigate to production wallet.tonkeeper.com, instead of testing version
    await page.getByRole('link', { name: 'Sign in with Tonkeeper Web' }).click();

    await expect(
        page.locator('#react-portal-modal-container').getByText('UQAG…gyIO')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Connect wallet' }).click();
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill('123456');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByRole('link', { name: 'Connected Apps' }).click();
    await expect(page.getByText('getgems.io')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Disconnect' })).toBeVisible();
    await expect(page.getByRole('listitem')).toContainText('Disconnect');
    await page.getByRole('link', { name: 'Settings' }).click();
    await page
        .locator('div')
        .filter({ hasText: /^Delete Account$/ })
        .nth(1)
        .click();
    await page
        .locator('div')
        .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
        .locator('div')
        .click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});
