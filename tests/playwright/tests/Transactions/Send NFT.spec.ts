import { test, expect } from '@playwright/test';

//Transfer NFT to myself + "Done" as a success of transaction

test.setTimeout(4 * 60 * 1000);

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24_2);
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
  await page.locator('#react-portal-modal-container').getByRole('textbox').fill('Test wallet for NFT transfer');
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

test('Transfer NFT', async ({ page }) => {
  await page.getByRole('link', { name: 'Collectibles' }).click();
  await page.locator('.sc-gKRSaq').click();
  await expect(page.locator('#react-portal-modal-container').getByText('Moonbirds')).toBeVisible();
  await expect(page.locator('form')).toContainText('Moonbirds');
  await page.getByRole('button', { name: 'Transfer', exact: true }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('UQDJ3uzSvsW4TGnWfcmBOKpQBqRpMEbwsJJ66ci4bdOISXO9');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#react-portal-modal-container')).toContainText('EQCq…k2hS');
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await page.getByLabel('Password').fill('123456');
  await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Done')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('img').first().click();
});

//Transfer NFT to myself and wait for pending transaction in the history

test('Transfer NFT + pending', async ({ page }) => {
  await page.getByRole('link', { name: 'Collectibles' }).click();
  await page.locator('.sc-gKRSaq').click();
  await expect(page.locator('#react-portal-modal-container').getByText('Moonbirds')).toBeVisible();
  await expect(page.locator('form')).toContainText('Moonbirds');
  await page.getByRole('button', { name: 'Transfer', exact: true }).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('UQDJ3uzSvsW4TGnWfcmBOKpQBqRpMEbwsJJ66ci4bdOISXO9');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#react-portal-modal-container')).toContainText('EQCq…k2hS');
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await page.getByLabel('Password').fill('123456');
  await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('Done')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('img').first().click();

  // Navigate to history tab
  await expect(page.getByRole('link', { name: 'History' })).toBeVisible();
  await page.getByRole('link', { name: 'History' }).click();

  // Wait pending transaction transaction in the history tab
  await expect(page.getByText('Pending')).toBeVisible({ timeout: 40 * 1000 });
});