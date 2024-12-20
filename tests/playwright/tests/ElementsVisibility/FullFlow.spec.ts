import { test, expect } from '@playwright/test';


//Run full flow of adding a wallet and ensure all elements are visible
test.setTimeout(4 * 60 * 1000);

test('Full flow elements', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_ANANAS);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Choose Wallets' })).toBeVisible();
  await expect(page.locator('h2')).toContainText('Choose Wallets');
  await expect(page.getByText('Choose wallets you want to')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Choose wallets you want to add.');
  await expect(page.getByRole('button').nth(1)).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Password', { exact: true }).fill('123456');
  await page.getByLabel('Re-enter password').click();
  await page.getByLabel('Re-enter password').fill('123456');
  await expect(page.getByRole('heading', { name: 'Create password' })).toBeVisible();
  await expect(page.locator('form')).toContainText('Create password');
  await expect(page.locator('form')).toContainText('Must be at least 6 characters.');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Name your wallet' })).toBeVisible();
  await expect(page.getByRole('heading')).toContainText('Name your wallet');
  await expect(page.getByText('Name your wallet to easily')).toBeVisible();
  await expect(page.locator('form')).toContainText('Name your walletName your wallet to easily identify it while using the Tonkeeper. These names are stored locally, and can only be seen by you.');
  await expect(page.locator('form')).toContainText('Save');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Congratulations! You’ve set' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByText('Delete Account').click();
  await expect(page.getByRole('heading', { name: 'Delete wallet data' })).toBeVisible();
  await expect(page.getByRole('heading')).toContainText('Delete wallet data');
  await expect(page.getByText('Wallet keys and all personal')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Wallet keys and all personal data will be erased from this device.');
  await expect(page.getByText('I have a backup copy of recovery phraseBack up now')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('I have a backup copy of recovery phrase');
  await expect(page.locator('#react-portal-modal-container')).toContainText('Back up now');
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await expect(page.getByRole('button', { name: 'Delete wallet data' })).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Delete wallet data');
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});