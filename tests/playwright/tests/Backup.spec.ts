import { test, expect } from '@playwright/test';

//Check backup presence for regular mainnet wallet
test.setTimeout(4 * 60 * 1000);
test('Backup', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24_5);
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
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Wallet Tokens Setup' })).toBeVisible();
  await page.getByText('Configure token support for').click();
  await expect(page.locator('form')).toContainText('Configure token support for easier wallet management.');
  await page.getByText('USD₮TRC20').click();
  await page.getByText('Use USD₮ TRC20 without TRX.').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.locator('div').filter({ hasText: /^Backup$/ }).click();
  await page.getByLabel('Password').fill('123456');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('1. switch')).toBeVisible();
  await expect(page.getByText('9.  elite')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Write down these 24 words in the order given below and store them in a secret, safe place.');
  await expect(page.getByRole('heading')).toContainText('Your recovery phrase');
  await page.getByRole('button', { name: 'Export TRC20 Wallet' }).click();
  await expect(page.getByRole('heading', { name: 'Export TRC20 Wallet' })).toBeVisible();
  await expect(page.getByText('This phrase is for TRC20 only')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('This phrase is for TRC20 only. It cannot restore your TON wallet. Use your TON recovery phrase for TON wallet recovery.');
  await expect(page.getByText('Write down these 12 words in')).toBeVisible();
  await page.getByText('1. memory').click();
  await page.getByText('6. resource').click();
  await page.getByRole('button', { name: 'Copy' }).click();
  await expect(page.getByText('Copied')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').nth(1).click();
  await page.getByText('Sign Out').click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
  await page.locator('#react-portal-modal-container').getByRole('textbox').fill('123456');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});