import { test, expect } from '@playwright/test';

//Dashboard for a single wallet + its elements` visibility

test('Dashboard + elements', async ({ page }) => {
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
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.locator('#root')).toContainText('Dashboard');
    await expect(page.getByRole('button', { name: 'Ananas UQBA…OP8V W5 UQDH…TkZ5' })).toBeVisible();
    await page.getByText('Dashboard').click();
    await expect(page.getByText('Name')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Ananas 🍍 v3R1' }).locator('span')).toBeVisible();
    await expect(page.locator('tbody')).toContainText('Ananas');
    await expect(page.locator('tbody')).toContainText('v3R1');
    await expect(page.getByRole('cell', { name: 'Ananas 🍍 v3R2' }).locator('span')).toBeVisible();
    await expect(page.locator('tbody')).toContainText('v3R2');
    await expect(page.getByRole('cell', { name: 'Ananas 🍍 v4R2' }).locator('span')).toBeVisible();
    await expect(page.locator('tbody')).toContainText('Ananas');
    await expect(page.locator('tbody')).toContainText('v4R2');
    await expect(
        page.getByRole('cell', { name: 'Ananas 🍍 W5 beta' }).locator('span')
    ).toBeVisible();
    await expect(page.locator('tbody')).toContainText('W5 beta');
    await expect(
        page.getByRole('cell', { name: 'Ananas 🍍 W5', exact: true }).locator('span')
    ).toBeVisible();
    await expect(page.locator('tbody')).toContainText('W5');
    await page.getByText('Preferences').click();
    await page.getByText('Sign Out').click();
    await page
        .locator('div')
        .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
        .locator('div')
        .click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});
