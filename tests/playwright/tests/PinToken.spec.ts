import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#create-password').fill('1а5б6у');
  await page.locator('#create-password-confirm').fill('1а5б6у');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'Congratulations! You’ve set' })).toBeVisible();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).nth(1).click();
  await expect(page.getByRole('heading', { name: 'Tokens' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All Assets' })).toBeVisible();
});


// We can pin token
test('Pin/ unpin', async ({ page }) => {
  await expect(page.getByText('Tether USD')).toBeVisible();
  await expect(page.locator('.sc-jZthAc > svg').first()).toBeVisible();
  await expect(page.locator('.sc-gOjSVr > svg > path').first()).toBeVisible();
  await page.locator('.sc-gOjSVr > svg').first().click();
  await page.locator('.sc-jZthAc > svg').first().click();
  await page.locator('.sc-jZthAc > svg > g > path').first().click();
  await expect(page.getByRole('heading', { name: 'Pinned' })).toBeVisible();
  await expect(page.locator('.sc-kudfUX')).toBeVisible();
  await page.locator('.sc-hRxdHw > .sc-laRQQM').click();
  await page.getByRole('link', { name: 'Tokens' }).first().click();
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: 'Tokens' }).nth(1).click();
  //Unpin token
  await page.locator('.sc-gOjSVr > svg > g > path').first().click();
});


//Pin 2 tokens, they`re after TON in the list on main page
test('Pin 2 tokens', async ({ page }) => {
  await page.locator('div:nth-child(4) > .sc-jNMdxs > div:nth-child(2) > span > .sc-jZthAc > svg > g > path').click();
  await page.locator('div:nth-child(3) > .sc-jNMdxs > div:nth-child(2) > span > .sc-jZthAc > svg > g > path').click();
  await expect(page.getByRole('heading', { name: 'Pinned' })).toBeVisible();
  await expect(page.locator('.sc-jNMdxs').first()).toBeVisible();
  await expect(page.locator('div:nth-child(2) > .sc-jNMdxs').first()).toBeVisible();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await expect(page.getByText('TON').nth(2)).toBeVisible();
  await expect(page.getByText('MARGA').nth(1)).toBeVisible();
  await expect(page.getByText('DUST').nth(1)).toBeVisible();
});