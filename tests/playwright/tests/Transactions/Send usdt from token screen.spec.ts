import { test, expect } from '@playwright/test';

//send usdt from token screen + confirm successful transaction as soon as Done is visibleS
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
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill('Ananas');
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

test('Transfer usdt', async ({ page }) => {
    await page.getByText('USD₮').nth(1).click();
    await page.getByRole('button', { name: 'Send' }).nth(2).click();
    await page.getByRole('textbox').first().click();
    await page
        .getByRole('textbox')
        .first()
        .fill('UQD2NmD_lH5f5u1Kj3KfGyTvhZSX0Eg6qp2a5IQUKXxOGzCi');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByTestId('amount-input').click();
    await page.getByTestId('amount-input').fill('0.01');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Confirm and Send' }).click();
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill('123456');
    await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('Done')).toBeVisible();
});
