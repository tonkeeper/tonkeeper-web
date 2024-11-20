import { test, expect } from '@playwright/test';

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
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await page.getByRole('textbox').first().click();
    await page
        .getByRole('textbox')
        .first()
        .fill('UQD2NmD_lH5f5u1Kj3KfGyTvhZSX0Eg6qp2a5IQUKXxOGzCi');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel('TONTON0,00 USD').fill('0,01');
    await page.getByText('TON', { exact: true }).nth(3).click();
    await page.getByText('TONTON0,05 USD').click();
    await page.getByText('TON', { exact: true }).nth(3).click();
    await page.getByText('TONTON0,05 USD').click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Confirm and Send' }).click();
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill('123456');
    await page.getByRole('button', { name: 'Confirm' }).click();
    await page.locator('#react-portal-modal-container path').nth(2).click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.goto(`/wallet-settings`);
    await page.getByText('Delete Account').click();
    await page
        .locator('div')
        .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
        .locator('div')
        .click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});
