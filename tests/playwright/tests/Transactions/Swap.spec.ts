import { test, expect } from '@playwright/test';

// swap ton => usdt

test.setTimeout(4 * 60 * 1000);

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_ANANAS);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#create-password').fill('123456');
    await page.locator('#create-password-confirm').fill('123456');
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

test.describe('Swap Test', () => {
    test.beforeEach(async ({ page }) => {
        await page.getByRole('link', { name: 'History' }).click();
        // Page should have a record with "TON", wait loading
        await expect(page.getByRole('button', { name: 'All Tokens' })).toBeVisible();
        await expect(page.getByText('TON').nth(0)).toBeVisible({ timeout: 20 * 1000 });
        // And don't need a pending records, may wait a couple of mins
        await expect(page.getByText('Pending')).not.toBeVisible({ timeout: 2 * 60 * 1000 });
    });

    test('Should send swap ton to usdt and wait pending transaction', async ({ page }) => {
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

    //swap usdt => ton

    test('Should send swap usdt to ton and wait pending transaction', async ({ page }) => {
        await expect(page.getByRole('link', { name: 'Swap' })).toBeVisible();
        await page.getByRole('link', { name: 'Swap' }).click();

        await page.getByTestId('change-swap').click();

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
});
