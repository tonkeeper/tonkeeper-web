import { test, expect } from '@playwright/test';

//Buy TON flow on main screen

test('Buy TON on main screen', async ({ page }) => {
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
    .fill('123456');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Buy' }).click();
  await expect(page.getByRole('heading', { name: 'Buy TON' })).toBeVisible();
  await expect(page.getByText('Mercuryo')).toBeVisible();
  await expect(page.getByText('Instant one-click purchase up')).toBeVisible();
  await expect(page.locator('.sc-evBeLY').first()).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^NeocryptoInstantly buy with a credit card$/ }).nth(2)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^TransakAn instant swap engine$/ }).nth(1)).toBeVisible();
  await expect(page.locator('#react-portal-modal-container path').nth(1)).toBeVisible();
  await expect(page.locator('#react-portal-modal-container svg').nth(2)).toBeVisible();
  await expect(page.locator('#react-portal-modal-container svg').nth(3)).toBeVisible();
  await expect(page.getByText('Other ways to buy')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Other ways to buy');
  await page.getByText('Instant one-click purchase up').click();
  await expect(page.locator('.sc-heOuzO')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Instant one-click purchase up to 700 EUR with no KYC, using bank card, Apple Pay, Google Pay, or SEPA.');
  await expect(page.getByText('You are opening an external app not operated by Tonkeeper.Terms of usePrivacy')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('You are opening an external app not operated by Tonkeeper.');
  await expect(page.locator('#react-portal-modal-container')).toContainText('Terms of use');
  await expect(page.locator('#react-portal-modal-container')).toContainText('Privacy policy');
  await expect(page.getByText('Terms of use')).toBeVisible();
  await expect(page.getByText('Privacy policy')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Mercuryo' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Do not show again$/ }).locator('div')).toBeVisible();
  await expect(page.getByText('Do not show again')).toBeVisible();
  const page1Promise = page.waitForEvent('popup');
  await page.getByText('Terms of use').click();
  const page1 = await page1Promise;
  await page.getByText('Privacy policy').click();
  await page.getByRole('button', { name: 'Open Mercuryo' }).click();
});