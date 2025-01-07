import { test, expect } from '@playwright/test';

//Labels for versions are visible and have DESC order
test.setTimeout(4 * 60 * 1000);

test('Labels visibility', async ({ page }) => {
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
  await expect(page.getByRole('button', { name: 'Account 1 UQBA…OP8V W5 UQDH…' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('W5');
  await expect(page.locator('#root')).toContainText('UQDH…TkZ5');
  await expect(page.locator('#root')).toContainText('W5 beta');
  await expect(page.locator('#root')).toContainText('UQD2…GzCi');
  await expect(page.locator('#root')).toContainText('v4R2');
  await expect(page.locator('#root')).toContainText('UQDj…pOuv');
  await expect(page.locator('#root')).toContainText('v3R2');
  await expect(page.locator('#root')).toContainText('UQBW…lnEF');
  await expect(page.locator('#root')).toContainText('v3R1');
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.locator('div').filter({ hasText: /^Delete Account$/ }).nth(1).click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});