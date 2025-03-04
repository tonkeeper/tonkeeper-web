import { test, expect } from '@playwright/test';

//Buy Pro (full flow) BUT don`t do the last step (paying itself)

test('Buy PRO', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByRole('button', { name: '12 words' }).click();
  await page.getByLabel('1:', { exact: true }).click();
  await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_12_2);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#create-password').fill('123456');
  await page.locator('#create-password-confirm').fill('123456');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page
    .locator('#react-portal-modal-container')
    .getByRole('textbox')
    .fill('trust wallet - 12 words mnemonic');
  await page.getByText('🤖').click();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('button', { name: 'Get Pro' })).toBeVisible();
  await page.getByRole('button', { name: 'Get Pro' }).click();
  await expect(page.locator('img').nth(2)).toBeVisible();
  await expect(page.getByText('Tonkeeper Pro', { exact: true })).toBeVisible();
  await expect(page.getByText('A Tonkeeper Pro subscription')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('A Tonkeeper Pro subscription includes advanced wallet functionality, offering a suite of tools for managing your cryptocurrency.');
  await expect(page.getByRole('button', { name: 'Try Pro for Free' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Buy Pro' }).first()).toBeVisible();
  await expect(page.locator('#react-portal-modal-container svg').nth(1)).toBeVisible();
  await expect(page.getByText('Inside Tonkeeper Pro –')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Inside Tonkeeper Pro – Dashboard');
  await expect(page.locator('#react-portal-modal-container')).toContainText('In the Dashboard you will have access to wallet analysis. This feature will benefit professional users who use Tonkeeper in their daily business.');
  await expect(page.locator('img').nth(3)).toBeVisible();
  await expect(page.locator('#react-portal-modal-container svg').nth(2)).toBeVisible();
  await expect(page.getByText('Multi-Send', { exact: true })).toBeVisible();
  await expect(page.getByText('With multi-send feature you')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('With multi-send feature you can send funds up to 255 addresses at once. Tonkeeper Pro saves time and simplifies the process of mass transactions.');
  await expect(page.locator('img').nth(4)).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('And other cool features are on the way.');
  await expect(page.getByRole('button', { name: 'Try Pro for Free' }).nth(1)).toBeVisible();
  await expect(page.getByText('Try Pro for FreeBuy Pro').nth(1)).toBeVisible();
  await expect(page.locator('#react-portal-modal-container').getByRole('button').first()).toBeVisible();
  await page.getByRole('button', { name: 'Buy Pro' }).first().click();
  await expect(page.getByText('Tonkeeper ProTonkeeper Pro\'s')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Tonkeeper ProTonkeeper Pro\'s subscription comes with an extended wallet feature, offering a toolset for crypto management.');
  await expect(page.getByText('Select Wallet for')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Select Wallet for authorization');
  await expect(page.locator('div').filter({ hasText: /^trust wallet - 12 words mnemonic🤖UQBC…_BrRW5$/ }).nth(1)).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^trust wallet - 12 words mnemonic🤖UQDe…xygmv4R2$/ }).nth(1)).toBeVisible();
  await page.locator('#react-portal-modal-container').getByText('UQBC…_BrRW5').click();
  await expect(page.getByText('Enter password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill('123456');
  await page.getByText('PasswordCancelConfirm').click();
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByRole('heading', { name: 'Tonkeeper Pro' })).toBeVisible();
  await expect(page.getByText('Tonkeeper Pro\'s subscription')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Tonkeeper Pro\'s subscription comes with an extended wallet feature, offering a toolset for crypto management.');
  await expect(page.locator('div').filter({ hasText: /^trust wallet - 12 words mnemonic🤖UQBC…_BrRW5$/ }).nth(2)).toBeVisible();
  await expect(page.getByText('Yearly Pro Package')).toBeVisible();
  await expect(page.getByText('8.00 TON')).toBeVisible();
  await expect(page.locator('div').filter({ hasText: /^Yearly Pro Package8\.00 TON$/ }).nth(2)).toBeVisible();
  await expect(page.getByLabel('Promo Code')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container').getByRole('button', { name: 'Buy', exact: true })).toBeVisible();
  await page.locator('#react-portal-modal-container').getByRole('button', { name: 'Buy', exact: true }).click();
  await page.locator('form').getByRole('button').first().click();
  await page.locator('#react-portal-modal-container').getByRole('button', { name: 'Buy', exact: true }).click();
  await expect(page.getByText('Insufficient balance')).toBeVisible();
  await expect(page.getByText('Confirm sending')).toBeVisible();
  await expect(page.getByText('RecipientUQCx…d3Zw')).toBeVisible();
  await expect(page.getByText('Amount')).toBeVisible();
  await expect(page.getByText('Fee')).toBeVisible();
  await expect(page.getByText('Comment')).toBeVisible();
});