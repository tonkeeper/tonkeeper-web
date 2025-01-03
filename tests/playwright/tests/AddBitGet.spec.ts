import { test, expect } from '@playwright/test';

//Add BITGET wallet 24 mnemonic + ensure address is correct

test('BITGET', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.BITGET_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('W5', { exact: true })).toBeVisible();
  await expect(page.getByText('UQC2…1-Ly · 0 TON')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('UQC2…1-Ly · 0 TON');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Password', { exact: true }).fill('123456');
  await page.getByLabel('Re-enter password').click();
  await page.getByLabel('Re-enter password').fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('BITGET');
  await page.getByText('🧜', { exact: true }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('BITGET').first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('BITGET');
  await expect(page.getByText('UQC2…1-Ly')).toBeVisible();
  await expect(page.locator('#root')).toContainText('UQC2…1-Ly');
  await expect(page.getByRole('button', { name: 'BITGET' })).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByText('Delete Account').click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
});