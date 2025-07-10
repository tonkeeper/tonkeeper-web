import { test, expect } from '@playwright/test';
test.setTimeout(4 * 60 * 1000);
//Add BITGET wallet 24 mnemonic + ensure address is correct

test('BITGET', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.BITGET_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#create-password').fill('123456');
  await page.locator('#create-password-confirm').fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('BITGET');
  await page.getByText('🧜', { exact: true }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Wallet Tokens Setup' })).toBeVisible();
  await page.getByText('Configure token support for').click();
  await expect(page.locator('form')).toContainText('Configure token support for easier wallet management.');
  await page.getByText('USD₮TRC20').click();
  await page.getByText('Use USD₮ TRC20 without TRX.').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('BITGET').first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('BITGET');
  await expect(page.getByText('UQC2…1-Ly')).toBeVisible();
  await expect(page.locator('#root')).toContainText('UQC2…1-Ly');
  await expect(page.getByRole('button', { name: 'BITGET' })).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByText('Delete Account').click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
  await page.locator('#react-portal-modal-container').getByRole('textbox').fill('123456');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});