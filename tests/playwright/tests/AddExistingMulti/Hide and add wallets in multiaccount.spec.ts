import { test, expect } from '@playwright/test';

//Hide and add wallets in multiaccount + open added wallet in Settings

test('Hide/ add wallets', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24_3);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#create-password').fill('123456');
    await page.locator('#create-password-confirm').fill('123456');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByText('Hide Current Wallet').click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page
        .getByRole('button', { name: 'Account 1 Multi Wallet 3 #3' })
        .getByRole('button')
        .click();
    await page.getByRole('button', { name: 'Add' }).nth(1).click();
    await page.getByRole('button', { name: 'Open' }).first().click();
    await expect(page.getByRole('button', { name: 'Account 1 Multi Wallet 2 #2' })).toBeVisible();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByText('Preferences').click();
    await page.getByText('Sign Out').click();
    await page
        .locator('div')
        .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
        .locator('div')
        .click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});
