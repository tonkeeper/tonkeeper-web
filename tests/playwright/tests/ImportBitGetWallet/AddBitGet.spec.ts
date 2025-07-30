import { test, expect } from '@playwright/test';

test.setTimeout(4 * 60 * 1000);

const PASSWORD1 = process.env.TEST_PASSWORD1 || '';
const MNEMONIC = process.env.BITGET_MNEMONIC_24 || '';

async function clickContinue(page, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.getByRole('button', { name: 'Continue' }).click();
  }
}

test('BITGET wallet import and delete flow', async ({ page }) => {
  await test.step('Import wallet', async () => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).fill(MNEMONIC);
    await clickContinue(page, 3);
    await page.locator('#create-password').fill(PASSWORD1);
    await page.locator('#create-password-confirm').fill(PASSWORD1);
    await clickContinue(page);
    await page.getByLabel('Wallet name').fill('BITGET');
    await page.getByText('🧜', { exact: true }).click();
    await clickContinue(page);
  });

  await test.step('Tokens', async () => {
    await expect(page.getByRole('heading', { name: 'Wallet Tokens Setup' })).toBeVisible();
    await page.getByText('Configure token support for').click();
    await expect(page.locator('form')).toContainText('Configure token support for easier wallet management.');
    await page.getByText('USD₮TRC20').click();
    await page.getByText('Use USD₮ TRC20 without TRX.').click();
    await clickContinue(page);
  });

  await test.step('Check wallet', async () => {
    const walletName = page.getByText('BITGET').first();
    await expect(walletName).toBeVisible();
    await expect(walletName).toHaveText(/BITGET/);
    await expect(page.locator('#root')).toContainText(/UQC2…1-Ly/);
    await expect(page.getByRole('button', { name: 'BITGET' })).toBeVisible();
  });

  await test.step('Delete wallet', async () => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByText('Delete Account').click();
    await page.locator('div').filter({ hasText: /^I have a backup copy of recovery phrase$/ }).locator('div').click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill(PASSWORD1);
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  });
});
