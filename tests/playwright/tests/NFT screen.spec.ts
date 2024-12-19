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

  //Collectibles
  await page.getByRole('link', { name: 'Collectibles' }).click();
  await page.getByText('Citrus').click();
  await expect(page.locator('h3').filter({ hasText: 'Citrus' })).toBeVisible();
  await expect(page.getByText('Unverified NFT')).toBeVisible();
  await page.locator('span').filter({ hasText: 'Unverified NFT' }).getByRole('img').click();
  await expect(page.getByRole('heading', { name: 'Unverified NFT' })).toBeVisible();
  await expect(page.getByText('NFT may not be safe to use')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('NFT may not be safe to use for one of the following reasons.');
  await expect(page.getByRole('list')).toContainText('Used for spam. Employed for sending unwanted and often irrelevant messages at scale.');
  await expect(page.getByRole('list')).toContainText('Used for scam. NFT\'s name, description or image can lead users into deception.');
  await expect(page.getByRole('list')).toContainText('We know little about the author and history of this NFT.');
  await expect(page.getByRole('button', { name: 'Report Spam' }).nth(1)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Not Spam' }).nth(1)).toBeVisible();
  await page.getByRole('button', { name: 'Not Spam' }).nth(1).click();
  await expect(page.getByRole('button', { name: 'Transfer' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'View on NFT Market' })).toBeVisible();
  await expect(page.getByText('DetailsView in explorer')).toBeVisible();
  await expect(page.getByText('OwnerUQAG…gyIO')).toBeVisible();
  await expect(page.getByText('Contract addressEQDo…YPQe')).toBeVisible();
  const page3Promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'View on NFT Market' }).click();
  const page3 = await page3Promise;
  await page.locator('#react-portal-modal-container').getByRole('img').first().click();

  //Domains
  await page.getByRole('link', { name: 'Domains' }).click();
  await expect(page.getByText('Your domains will be shown hereBuy, sell, exchange and collect.Explore apps and')).toBeVisible();
  await page.getByRole('button', { name: 'Explore apps and services in' }).click();
  await expect(page.locator('div').filter({ hasText: /^Digital nomads$/ })).toBeVisible();
});