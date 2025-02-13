import { test, expect } from '@playwright/test';

//Can add versions using gear in a regular wallet 

test.setTimeout(4 * 60 * 1000);

test('Add /hide version by gear', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24_2);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('123456');
  await page.locator('input[type="password"]').nth(1).click();
  await page.locator('input[type="password"]').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('%Test name%');
  await page.getByText('🧠').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: '%Test name% UQDJ…SXO9 W5 UQAg…' }).getByRole('button')).toBeVisible();
  await page.getByRole('button', { name: '%Test name% UQDJ…SXO9 W5 UQAg…' }).getByRole('button').click();
  await expect(page.getByText('Version')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Version');
  await page.getByRole('button', { name: 'Hide' }).nth(2).click();
  await page.getByRole('button', { name: 'Add' }).nth(2).click();
  await page.getByRole('button', { name: 'Open' }).nth(1).click();
  await page.getByText('Preferences').click();
  await page.getByText('Sign Out').click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
});

//Add wallet v3 + By clicking "Open" fall into the wallet v3

test('test', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24_2);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Password', { exact: true }).fill('123456');
  await page.getByLabel('Re-enter password').click();
  await page.getByLabel('Re-enter password').fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Account 1 UQDJ…SXO9 W5 UQAg…' }).getByRole('button').click();
  await page.getByRole('button', { name: 'Add' }).nth(1).click();
  await page.getByRole('button', { name: 'Open' }).first().click();
  await expect(page.locator('#root')).toContainText('UQDP…-Pi6');
  await expect(page.getByRole('button', { name: 'Account 1 UQDJ…SXO9 W5 UQAg…' })).toBeVisible();
  await page.getByText('Preferences').click();
  await page.getByText('Sign Out').click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
});

//Can add versions via settings tab in a regular wallet 

test('Versions via settings', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('div')
    .filter({ hasText: /^Password$/ })
    .getByRole('textbox')
    .fill('W123*4567');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('W123*4567');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Active address v4R2' }).click();
  await page.getByRole('button', { name: 'Add' }).first().click();
  await expect(page.locator('#root')).toContainText('UQCk…yXNw');
  await expect(page.locator('#root')).toContainText('v3R2');
  await expect(page.locator('#root')).toContainText('UQC0…6y4I · 0 TON');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.locator('#root')).toContainText('UQBP…Hy5i');
  await expect(page.locator('#root')).toContainText('W5');
  await page.getByRole('button', { name: 'Hide' }).nth(1).click();
  await page.getByRole('button', { name: 'Hide' }).nth(2).click();
  await page.getByText('Preferences').click();
  await page.locator('div').filter({ hasText: /^Sign Out$/ }).nth(1).click();
  await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
});