import { test, expect } from '@playwright/test';

test.setTimeout(4 * 60 * 1000);

const MNEMONIC = process.env.TON_MNEMONIC_24 ?? '';
const PASSWORD = process.env.TEST_PASSWORD ?? '';
const WALLET_NAME = 'Visibility test wallet';

async function importWallet(page: any) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
  await page.getByLabel('1:', { exact: true }).fill(MNEMONIC);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.locator('#create-password').fill(PASSWORD);
  await page.locator('#create-password-confirm').fill(PASSWORD);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Wallet name').fill(WALLET_NAME);
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
}

async function checkMainScreenElements(page: any) {
  const texts = [
    WALLET_NAME, 'Dashboard', 'Discover', 'Add Wallet', 'Preferences', 'Get Pro', 'Hide Statistics'
  ];

  const links = [
    'Tokens', 'History', 'Collectibles', 'Domains', 'Swap', 'Multisig Wallets', 'Tonkeeper Battery', 'Settings'
  ];

  const buttons = [
    { name: 'Send', exact: true }, { name: 'Multi Send' }, { name: 'Receive' }, { name: 'Buy' }, { name: 'Get Pro' }
  ];

  for (const text of texts) {
    await expect(page.locator('#root')).toContainText(text);
  }

  for (const link of links) {
    await expect(page.getByRole('link', { name: link })).toBeVisible();
  }

  for (const btn of buttons) {
    await expect(page.getByRole('button', btn)).toBeVisible();
  }

  await page.getByRole('link', { name: 'Domains' }).click();
  await page.getByRole('link', { name: 'Tokens' }).click();
  await expect(page.getByText('Tokens').nth(1)).toBeVisible();
}

test('🧩 Visibility of key elements on Main screen', async ({ page }) => {
  await test.step('Import existing wallet', async () => {
    await importWallet(page);
  });

  await test.step('Check interface  elements', async () => {
    await checkMainScreenElements(page);
  });
});
