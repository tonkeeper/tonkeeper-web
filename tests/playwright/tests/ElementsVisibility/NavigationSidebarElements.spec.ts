import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
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
    .fill('1%23456!');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('1%23456!');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#react-portal-modal-container').getByRole('textbox').fill('Ananas');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Congratulations! You’ve set' })).toBeVisible();
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

//Inspect elements in History sidebar tab

test('History tab', async ({ page }) => {
  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.getByText('History').nth(1)).toBeVisible();
  await expect(page.locator('#root')).toContainText('History');
  await expect(page.locator('div').filter({ hasText: /^HistoryAll Tokens$/ }).getByRole('button').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'All Tokens' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('All Tokens');
  await expect(page.locator('div').filter({ hasText: /^HistoryAll Tokens$/ }).getByRole('button').nth(2)).toBeVisible();
  await page.locator('div').filter({ hasText: /^HistoryAll Tokens$/ }).getByRole('button').nth(2).click();
  await expect(page.locator('div').filter({ hasText: /^Initiator$/ })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Hide SpamFilter is not reset on restart$/ }).first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('Initiator');
  await expect(page.locator('#root')).toContainText('Hide Spam');
  await expect(page.locator('#root')).toContainText('Filter is not reset on restart');
  await page.locator('div').filter({ hasText: /^Initiator$/ }).click();
  await page.locator('div').filter({ hasText: /^Hide SpamFilter is not reset on restart$/ }).first().click();
  const page1Promise = page.waitForEvent('popup');
  await page.locator('div').filter({ hasText: /^HistoryAll TokensInitiatorHide SpamFilter is not reset on restart$/ }).getByRole('button').first().click();
  const page1 = await page1Promise;
  await expect(page1.locator('.ldpypfq')).toBeVisible();
});

//Inspect elements in Collectibles and domains sidebar tab

test('Collectibles and domains', async ({ page }) => {
  await page.getByRole('link', { name: 'Collectibles' }).click();
  await expect(page.getByText('Collectibles').nth(1)).toBeVisible();
  await expect(page.locator('#root')).toContainText('Collectibles');
  await expect(page.locator('.sc-licbtr > .sc-laRQQM')).toBeVisible();
  await page.getByRole('link', { name: 'Domains' }).click();
  await expect(page.getByText('Domains', { exact: true }).nth(1)).toBeVisible();
  await expect(page.locator('#root')).toContainText('Domains');
  await expect(page.locator('.sc-licbtr > .sc-laRQQM')).toBeVisible();
});

//Inspect elements in Swap tab

test('Swap', async ({ page }) => {
  await page.getByRole('link', { name: 'Swap' }).click();
  await expect(page.getByText('Swap').nth(1)).toBeVisible();
  await expect(page.locator('#root')).toContainText('Swap');
  await expect(page.locator('.sc-cDYBfd > button').first()).toBeVisible();
  await expect(page.locator('.sc-cDYBfd > button:nth-child(2)')).toBeVisible();
  await expect(page.locator('span').filter({ hasText: 'Send' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'TON' })).toBeVisible();
  await expect(page.getByText('Balance:').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'MAX' })).toBeVisible();
  await expect(page.getByTestId('change-swap')).toBeVisible();
  await expect(page.locator('span').filter({ hasText: /^Receive$/ })).toBeVisible();
  await expect(page.getByText('Balance:').nth(1)).toBeVisible();
  await expect(page.getByRole('button', { name: 'USD₮' })).toBeVisible();
  await expect(page.getByText('Transaction Information')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Transaction Information$/ }).getByRole('button')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(page.getByText('Provider')).toBeVisible();
  await expect(page.locator('#root')).toContainText('Provider');
  await expect(page.getByText('STON.fi')).toBeVisible();
  await expect(page.getByText('DeDust')).toBeVisible();
  await page.locator('div').filter({ hasText: /^Transaction Information$/ }).getByRole('button').click();
  await expect(page.getByText('Transaction Information')).toBeVisible();
  await expect(page.getByText('Price Impact')).toBeVisible();
  await expect(page.getByText('Minimum received')).toBeVisible();
  await expect(page.getByText('Slippage')).toBeVisible();
  await expect(page.getByText('Blockchain fee')).toBeVisible();
  await expect(page.getByText('Route')).toBeVisible();
  await page.locator('div').filter({ hasText: /^Transaction Information$/ }).getByRole('button').click();
});

//Inspect elements in Multisig sidebar tab

test('Multisig', async ({ page }) => {
  await page.getByRole('link', { name: 'Multisig Wallets' }).click();
  await expect(page.getByRole('button', { name: 'New Multisig Wallet' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('New Multisig Wallet');
  await expect(page.locator('.sc-kLKjoy > button').first()).toBeVisible();
  await expect(page.locator('.sc-kLKjoy > button:nth-child(2)').first()).toBeVisible();
  await expect(page.locator('.sc-kLKjoy > .sc-bXDltw').first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('Open');
  await page.getByRole('button', { name: 'New Multisig Wallet' }).click();
  await expect(page.getByRole('button', { name: 'Buy Pro' }).first()).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
});

//Inspect elements in Settings sidebar tab

test('Settings', async ({ page }) => {
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByText('Settings').nth(1)).toBeVisible();
  await expect(page.getByText('Ananas').nth(2)).toBeVisible();
  await expect(page.getByText('Customize')).toBeVisible();
  await expect(page.getByText('Backup')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Backup$/ }).getByRole('img')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Active address W5' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Active address');
  await expect(page.locator('#root')).toContainText('W5');
  await expect(page.getByRole('link', { name: 'Tokens' }).nth(1)).toBeVisible();
  await expect(page.locator('#root')).toContainText('Tokens');
  await expect(page.getByRole('link', { name: 'Collectibles' }).nth(1)).toBeVisible();
  await expect(page.locator('#root')).toContainText('Collectibles');
  await expect(page.getByRole('link', { name: 'Connected Apps' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('Connected Apps');
  await expect(page.locator('div').filter({ hasText: /^Delete Account$/ }).first()).toBeVisible();
});

