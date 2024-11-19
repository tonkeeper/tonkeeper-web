import { test, expect } from '@playwright/test';

// swap ton-usdt

test.setTimeout(60 * 1000);

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_ANANAS);
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
});

test.afterEach(async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByText('Delete Account').click();
    await page
        .locator('div')
        .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
        .locator('div')
        .click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});

test('Should send swap message to blockchain and wait pending transaction', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Swap' })).toBeVisible();
    await page.getByRole('link', { name: 'Swap' }).click();

    await page.getByPlaceholder('0.00').click();
    await page.getByPlaceholder('0.00').fill('0.01');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill('123456');
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Check that model is closed and app navigate to history
    await expect(page.getByRole('button', { name: 'All Tokens' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'History' })).toBeVisible();

    // Wait pending transaction transaction
    await expect(page.getByText('Pending')).toBeVisible({ timeout: 40 * 1000 });
});
