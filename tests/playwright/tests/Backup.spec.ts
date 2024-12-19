import { test, expect } from '@playwright/test';

//Check backup presence for regular mainnet wallet

test('Backup', async ({ page }) => {
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
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.locator('div').filter({ hasText: /^Backup$/ }).click();
  await page.getByLabel('Password').fill('123456');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByText('1. blanket')).toBeVisible();
  await expect(page.getByText('9. breeze')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Write down these 24 words in the order given below and store them in a secret, safe place.');
  await expect(page.getByRole('heading')).toContainText('Your recovery phrase');
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  await page.getByText('Delete Account').click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
});