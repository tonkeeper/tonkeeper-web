import { test, expect } from '@playwright/test';

//Add one testnet account 
test.setTimeout(4 * 60 * 1000);

test('Add 1 testnet', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Testnet Account Import wallet' }).click();
  await expect(page.getByRole('heading', { name: 'Enter your recovery phrase' })).toBeVisible();
  await expect(page.locator('h2')).toContainText('Enter your recovery phrase');
  await expect(page.getByText('To restore access to your')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('To restore access to your wallet, enter the 24 secret recovery words given to you when you created your wallet.');
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Password', { exact: true }).fill('!234567');
  await page.getByLabel('Re-enter password').fill('!234567');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('TeStNeT Wallet');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('link', { name: 'Testnet' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Testnet');
  await expect(page.getByText('TeStNeT Wallet').first()).toBeVisible();
  await expect(page.getByText('0QDC…QPPc').first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('0QDC…QPPc');
  await expect(page.locator('div').filter({ hasText: /^Dashboard$/ })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Discover$/ })).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByText('Delete Account').click();
  await page
    .locator('div')
    .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
    .locator('div')
    .click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
  await page.locator('#react-portal-modal-container').getByRole('textbox').fill('!234567');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});
