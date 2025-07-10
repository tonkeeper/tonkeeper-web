import { test, expect } from '@playwright/test';
test.setTimeout(4 * 60 * 1000);

//Add parent wallet and delete from Preferences

test('Add existing multi wallet', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24_3);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#create-password').fill('123456');
    await page.locator('#create-password-confirm').fill('123456');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'Wallet Tokens Setup' })).toBeVisible();
    await page.getByText('Configure token support for').click();
    await expect(page.locator('form')).toContainText('Configure token support for easier wallet management.');
    await page.getByText('USD₮TRC20').click();
    await page.getByText('Use USD₮ TRC20 without TRX.').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByText('Preferences').click();
    await page.getByText('Sign Out').click();
    await page
        .locator('div')
        .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
        .locator('div')
    await page.locator('.sc-dwcvcB').click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});