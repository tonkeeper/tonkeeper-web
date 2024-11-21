import { test, expect } from '@playwright/test';

//add trust wallet (12 words) and confirm that TON & USDT are visible +
//multisend element is visible and is called Multisend

test('trust + assert visibility and value', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByRole('button', { name: '12 words' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_12_2);
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
    await page
        .locator('#react-portal-modal-container')
        .getByRole('textbox')
        .fill('trust wallet - 12 words mnemonic');
    await page.getByText('🤖').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('TON').first()).toBeVisible();
    await expect(page.getByText('USD₮')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Multi Send' })).toBeVisible();
    await expect(page.locator('#root')).toContainText('Multi Send');
});
