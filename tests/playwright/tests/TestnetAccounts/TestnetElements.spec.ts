import { test, expect } from '@playwright/test';

//Add testnet account, check elements visibility


test('Testnet elements', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Testnet Account Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_ANANAS);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('0QDj…pFAl')).toBeVisible();
  await expect(page.getByText('0QD2…G4so')).toBeVisible();
  await expect(page.getByText('0QAT…ddQF')).toBeVisible();
  await expect(page.getByText('0QD-…agbX')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Password', { exact: true }).fill('123456');
  await page.getByLabel('Re-enter password').click();
  await page.getByLabel('Re-enter password').fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Send');
  await expect(page.getByRole('button', { name: 'Multi Send' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Multi Send');
  await expect(page.getByRole('button', { name: 'Receive' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Receive');
  await expect(page.getByText('Tokens').nth(1)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tokens' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'History' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Collectibles' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Domains' })).toBeVisible();
  await expect(page.getByText('TokensHistoryCollectiblesDomainsSettings')).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();

  //hide/add versions via Settings
  await page.getByRole('link', { name: 'Active address W5' }).click();
  await page.getByRole('button', { name: 'Hide' }).first().click();
  await page.getByRole('button', { name: 'Hide' }).first().click();
  await page.getByRole('button', { name: 'Add' }).nth(2).click();
  await page.getByRole('button', { name: 'Open' }).first().click();

  // check Settings elements visibility 
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.locator('div').filter({ hasText: /^Settings$/ }).nth(1)).toBeVisible();
  await expect(page.getByText('🍍Account 1Customize')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Backup$/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Active address v4R2' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tokens' }).nth(1)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Collectibles' }).nth(1)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Connected Apps' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Delete Account$/ }).nth(1)).toBeVisible();

  // check backup presence 
  await page.locator('div').filter({ hasText: /^Backup$/ }).click();
  await page.getByLabel('Password').fill('123456');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('1. blanket')).toBeVisible();
  await expect(page.getByText('9. breeze')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your recovery phrase' })).toBeVisible();
  await expect(page.getByText('Write down these 24 words in')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Write down these 24 words in the order given below and store them in a secret, safe place.');
  await expect(page.locator('#react-portal-modal-container').getByRole('button')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();

  //ensure that testnet accounts aren`t visible on the dashboard
  await page.getByText('Dashboard').click();
  await expect(page.getByText('NameAddressTotal BalanceTotal TONGet more with Tonkeeper ProAccess advanced')).toBeVisible();
  await expect(page.getByText('$ 0Export .CSVManage')).toBeVisible();
  await page.getByText('Preferences').click();
  await page.getByText('Sign Out').click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
});