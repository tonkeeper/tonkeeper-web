import { test, expect } from '@playwright/test';

test('Discover tab', async ({ page }) => {
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
    .fill('dsbFbват^%*(&(');
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('dsbFbват^%*(&(');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill('Тестовый wallet!008');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Congratulations! You’ve set' })).toBeVisible();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');

  await page.locator('div').filter({ hasText: /^Discover$/ }).click();
  await expect(page.locator('div').filter({ hasText: /^Digital nomads$/ })).toBeVisible();
  await expect(page.getByText('ExchangesAll')).toBeVisible();
  await expect(page.getByText('DeFiAll')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^NFT$/ })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Fun$/ })).toBeVisible();
  await expect(page.getByText('TokenstoreBuy digital gift cards & game credits. Pay with TONTon VPNThe fast,')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^MercuryoFast fiat-to-crypto checkout$/ }).first()).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^AvanChangeExchange TON and 100\+ cryptos$/ }).first()).toBeVisible();
  await page.locator('div').filter({ hasText: /^ExchangesAll$/ }).getByRole('button').click();
  await expect(page.locator('#react-portal-modal-container').getByText('Exchanges')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container').getByRole('button')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^MercuryoFast fiat-to-crypto checkout$/ }).nth(2)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^NeocryptoInstantly buy TON, BTC with a credit card$/ }).nth(2)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^LetsExchangeExchange 4,500\+ cryptocurrencies for TON$/ }).nth(2)).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByText('STON.fi').nth(2).click();
  const page1 = await page1Promise;
  await expect(page.locator('.sc-bBrOHt').first()).toBeVisible();
  await expect(page.locator('button:nth-child(3)')).toBeVisible();
  await page.locator('button:nth-child(3)').click();
  await page.locator('button:nth-child(3)').click();
  await page.locator('.sc-bBrOHt').first().click();
});