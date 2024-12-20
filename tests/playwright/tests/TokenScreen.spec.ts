import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
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
  await page.getByLabel('Wallet name').fill('Account ');
  await page.getByLabel('Wallet name').click();
  await page.getByLabel('Wallet name').fill('Тестовый кошелёк');
  await page.getByLabel('Wallet name').click();
  await page.locator('div:nth-child(1664)').click();
  await page.getByText('❣️').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('#root')).toContainText('TON');
  await expect(page.locator('#root')).toContainText('USD₮');
});
//Review elements on token screet, clickable buttons + send ton but cancel

test('TON screen', async ({ page }) => {

  await page.getByText('TON').nth(2).click();
  await expect(page.getByText('Toncoin')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Toncoin$/ }).getByRole('button').first()).toBeVisible();
  await expect(page.getByRole('img', { name: 'TON' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send' }).nth(2)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Receive' }).nth(1)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Swap' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy' }).nth(1)).toBeVisible();
  await expect(page.getByText('History').nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Toncoin$/ }).getByRole('button').nth(1)).toBeVisible();
  await page.getByRole('button', { name: 'Swap' }).click();
  await expect(page.locator('div').filter({ hasText: /^Swap$/ }).nth(1)).toBeVisible();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByText('TON').nth(2).click();
  await page.getByRole('button', { name: 'Receive' }).nth(1).click();
  await expect(page.getByRole('heading', { name: 'Receive Toncoin' })).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Buy' }).nth(1).click();
  await expect(page.getByRole('heading', { name: 'Buy TON' })).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  await page.getByRole('button', { name: 'Send' }).nth(2).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('oleganza.ton');
  await page.getByText('oleganza.ton').click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Тестовый комментарий');
  await expect(page.getByText('UQBb…z6Pz')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('TONTON0.00 USD')).toBeVisible();
  await page.getByTestId('amount-input').fill('0.000000011');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await expect(page.getByText('Enter password')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Failed to send transaction')).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').click();
  await expect(page.getByText('Тестовый кошелёкUQAG…gyIOv4R2❣️')).toBeVisible();
});


test('Jetton screen', async ({ page }) => {

  await page.getByText('USD₮').nth(1).click();
  await expect(page.getByText('USD₮', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'USD₮' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send' }).nth(2)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Receive' }).nth(1)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Swap' })).toBeVisible();
  await expect(page.getByText('History').nth(1)).toBeVisible();
  await page.getByRole('button', { name: 'Swap' }).click();
  await expect(page.locator('div').filter({ hasText: /^Swap$/ }).nth(1)).toBeVisible();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await page.getByText('USD₮').nth(1).click();
  await page.getByRole('button', { name: 'Receive' }).nth(1).click();
  await expect(page.getByRole('heading', { name: 'Receive Toncoin' })).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button').first().click();
  await page.getByRole('button', { name: 'Send' }).nth(2).click();
  await page.getByRole('textbox').first().click();
  await page.getByRole('textbox').first().fill('oleganza.ton');
  await page.getByText('oleganza.ton').click();
  await page.getByRole('textbox').nth(1).click();
  await page.getByRole('textbox').nth(1).fill('Тестовый комментарий');
  await expect(page.getByText('UQBb…z6Pz')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('USD₮', { exact: true }).nth(2)).toBeVisible();
  await expect(page.getByText('USD₮USD₮0.00 USD')).toBeVisible();
  await page.getByTestId('amount-input').fill('0.0011');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await page.getByRole('button', { name: 'Confirm and Send' }).click();
  await expect(page.getByText('Enter password')).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Failed to send transaction')).toBeVisible();
});

