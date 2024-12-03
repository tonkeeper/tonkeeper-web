import { test, expect } from '@playwright/test';

//Add single general wallet and delete it

test('Add general wallet', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#create-password').fill('123456');
    await page.locator('#create-password-confirm').fill('123456');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByText('Delete Account').click();
    await page
        .locator('div')
        .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
        .locator('div')
        .click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});

// Add my personal test wallet and hide/open versions + change emoji

test('Add my test wallet & hide version', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24_2);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#create-password').fill('123456');
    await page.locator('#create-password-confirm').fill('123456');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill('My test wallet');
    await page.getByText('👽').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page
        .getByRole('button', { name: 'My test wallet UQDJ…SXO9 W5' })
        .getByRole('button')
        .click();
    await page.getByRole('button', { name: 'Hide' }).nth(1).click();
    await page.getByRole('button', { name: 'Add' }).nth(1).click();
    await page.getByRole('button', { name: 'Open' }).first().click();
    await page.getByRole('button', { name: 'My test wallet UQDJ…SXO9 W5' }).click();
    await page.getByRole('button', { name: 'My test wallet UQDJ…SXO9 W5' }).click();
});
