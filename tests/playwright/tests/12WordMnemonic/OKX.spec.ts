import { test, expect } from '@playwright/test';

//Add OKX wallet 12 words mnemonic + w5 version
test.setTimeout(4 * 60 * 1000);


test('OKX wallet', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByRole('button', { name: '12 words' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.OKX_MNEMONIC_12);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('v4R2')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('OKX wallet');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('UQAU…s4Eh')).toBeVisible();
  await expect(page.locator('#root')).toContainText('UQAU…s4Eh');
  await expect(page.getByText('OKX wallet').first()).toBeVisible();
  await expect(page.locator('#root')).toContainText('OKX wallet');
  await page.getByRole('button', { name: 'OKX wallet' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Add' }).nth(2).click();
  await page.getByRole('button', { name: 'Open' }).nth(1).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByText('Delete Account').click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
});


//Ensure that v4 is default for OKX wallet + Add versions w5 and v3 via Active address in settings

test('v4 default for OKX ', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByRole('button', { name: '12 words' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.OKX_MNEMONIC_12);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('v4R2')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('OKX wallet');
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.locator('#root')).toContainText('Active address');
  await expect(page.getByRole('link', { name: 'Active address v4R2' })).toBeVisible();
  await page.getByRole('link', { name: 'Active address v4R2' }).click();
  await page.getByRole('button', { name: 'Add' }).nth(2).click();
  await expect(page.getByRole('button', { name: 'Open' }).nth(1)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hide' }).nth(1)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add' }).nth(1)).toBeVisible();
  await page.getByRole('button', { name: 'Add' }).nth(1).click();
  await expect(page.getByRole('button', { name: 'Hide' }).first()).toBeVisible();
  await expect(page.getByText('UQB0…2Q5K · 0 TON')).toBeVisible();
  await page.locator('div').filter({ hasText: /^Active address$/ }).getByRole('button').click();
  await page.getByText('Delete Account').click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
  await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});