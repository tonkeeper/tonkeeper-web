import { test, expect } from '@playwright/test';

//Elements visibility on main screen
test.setTimeout(4 * 60 * 1000);
test('Main screen', async ({ page }) => {
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
  await page.getByLabel('Wallet name').fill('Ananas');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Ananas').first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('Ananas');
  await expect(page.getByText('UQBA…OP8V').first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('UQBA…OP8V');
  await expect(page.getByText('W5').first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('W5');
  await expect(page.locator('div').filter({ hasText: /^AnanasUQBA…OP8VW5$/ }).getByRole('img')).toBeVisible();
  await expect(page.getByText('🍍')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Dashboard$/ })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Dashboard');
  await expect(page.locator('div').filter({ hasText: /^Discover$/ })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Discover');
  await expect(page.getByRole('button', { name: 'Ananas UQBA…OP8V W5 UQDH…TkZ5' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('UQBA…OP8V');
  await expect(page.locator('#root')).toContainText('UQDH…TkZ5');
  await expect(page.locator('#root')).toContainText('UQD2…GzCi');
  await expect(page.locator('#root')).toContainText('UQDj…pOuv');
  await expect(page.locator('#root')).toContainText('UQBW…lnEF');
  await expect(page.locator('div').filter({ hasText: /^Add Wallet$/ })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Add Wallet');
  await expect(page.locator('div').filter({ hasText: /^Preferences$/ })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Preferences');
  await expect(page.getByRole('button', { name: 'Get Pro' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Get Pro');
  await expect(page.locator('div').filter({ hasText: /^Add WalletPreferencesGet Pro$/ }).getByRole('button').nth(1)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tokens' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'History' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Collectibles' })).toBeVisible();
  await page.getByRole('link', { name: 'Domains' }).click();
  await expect(page.getByRole('link', { name: 'Swap' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Multisig Wallets' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tonkeeper Battery' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Multi Send' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Receive' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy' })).toBeVisible();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await expect(page.getByText('Tokens').nth(1)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hide Statistics' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Hide Statistics');
  await expect(page.getByRole('region').locator('svg')).toBeVisible();
});