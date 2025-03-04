import { test, expect } from '@playwright/test';

test.setTimeout(4 * 60 * 1000);
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#create-password').fill('a]HmC.;MAcQJ[+Y@&r!-3h');
  await page.locator('#create-password-confirm').fill('a]HmC.;MAcQJ[+Y@&r!-3h');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
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

//has link to Tonviewer
test('History', async ({ page }) => {

  await page.getByRole('button', { name: 'Account 1 UQAG…gyIO v4R2 UQCk' }).click();
  await page.getByRole('link', { name: 'History' }).click();
  await expect(page.getByText('History').nth(1)).toBeVisible();
  const page1Promise = page.waitForEvent('popup');
  await page.locator('div').filter({ hasText: /^HistoryAll Tokens$/ }).getByRole('button').first().click();
  const page1 = await page1Promise;
  await expect(page1.locator('.ldpypfq')).toBeVisible();
  await expect(page1.getByPlaceholder('Search')).toBeVisible();
  await expect(page.getByRole('button', { name: 'All Tokens' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^HistoryAll Tokens$/ }).getByRole('button').nth(2)).toBeVisible();
});

//can filter by token / initiator
test('History filterS', async ({ page }) => {

  await page.getByRole('button', { name: 'Account 1 UQAG…gyIO v4R2 UQCk' }).click();
  await page.getByRole('link', { name: 'History' }).click();
  await page.getByRole('button', { name: 'All Tokens' }).click();
  await page.locator('div').filter({ hasText: /^TON$/ }).click();
  await page.getByRole('button', { name: 'TON' }).click();
  await page.locator('div').filter({ hasText: /^USD₮$/ }).click();
  await expect(page.getByText('HistoryUSD₮')).toBeVisible();
  await page.locator('div').filter({ hasText: /^HistoryUSD₮$/ }).getByRole('button').nth(2).click();
  await page.locator('div').filter({ hasText: /^Hide SpamFilter is not reset on restart$/ }).first().click();
  await expect(page.getByText('HistoryUSD₮InitiatorHide')).toBeVisible();
  await page.getByRole('button', { name: 'USD₮' }).click();
  await page.locator('div').filter({ hasText: /^HistoryUSD₮All TokensTONUSD₮JBCTDUSTMARGAAMBRBOLTMEMGRBSMCWTONDRIFTGGR$/ }).getByRole('button').nth(2).click();
  await page.locator('div').filter({ hasText: /^Hide SpamFilter is not reset on restart$/ }).first().click();
});