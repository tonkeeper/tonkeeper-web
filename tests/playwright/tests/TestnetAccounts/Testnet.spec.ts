import { test, expect } from '@playwright/test';

test.setTimeout(4 * 60 * 1000);

const MNEMONIC = process.env.TON_MNEMONIC_24 ?? '';
const PASSWORD = process.env.TEST_PASSWORD ?? '';
const WALLET_NAME = 'TeStNeT Wallet';

async function fillPasswordForm(page: any, password: string) {
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Re-enter password').fill(password);
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function deleteWallet(page: any, password: string) {
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByText('Delete Account').click();
  await page.locator('div')
    .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
    .locator('div')
    .click();
  await page.getByRole('button', { name: 'Delete wallet data' }).click();
  await page.locator('#react-portal-modal-container').getByRole('textbox').fill(password);
  await page.getByRole('button', { name: 'Confirm' }).click();
}

test('🔗 Import testnet wallet with mnemonic and delete it', async ({ page }) => {
  await test.step('Import testnet wallet', async () => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Testnet Account Import wallet' }).click();

    await expect(page.getByRole('heading', { name: 'Enter your recovery phrase' })).toBeVisible();
    await expect(page.locator('h2')).toContainText('Enter your recovery phrase');
    await page.getByLabel('1:', { exact: true }).fill(MNEMONIC);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();

    await fillPasswordForm(page, PASSWORD);
    await page.getByLabel('Wallet name').fill(WALLET_NAME);
    await page.getByRole('button', { name: 'Save' }).click();
  });

  await test.step('Import succeess check', async () => {
    await expect(page.getByRole('link', { name: 'Testnet' })).toBeVisible();
    await expect(page.locator('#root')).toContainText('Testnet');
    await expect(page.locator('#root')).toContainText(/0QDC.*QPPc/);
    await expect(page.locator('div').filter({ hasText: /^Dashboard$/ })).toBeVisible();
    await expect(page.locator('div').filter({ hasText: /^Discover$/ })).toBeVisible();
  });

  await test.step('Delete Wallete', async () => {
    await deleteWallet(page, PASSWORD);
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  });
});
