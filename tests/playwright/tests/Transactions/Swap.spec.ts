import { test, expect } from '@playwright/test';

// swap ton-usdt

test('test', async ({ page }) => {
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
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill('Ananas');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('link', { name: 'Swap' }).click();
    await page.goto(`/swap`);
    await page.getByPlaceholder('0,00').click();
    await page.getByPlaceholder('0,00').fill('0,01');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill('123456');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('link', { name: 'History' })).toBeVisible();
});
