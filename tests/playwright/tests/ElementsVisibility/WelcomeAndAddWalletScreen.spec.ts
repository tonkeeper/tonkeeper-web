import { test, expect } from '@playwright/test';

test.setTimeout(4 * 60 * 1000);

const EXPECTED_WELCOME_TEXTS = [
  'Welcome to Tonkeeper',
  'World-class speed',
  'End-to-end security',
  'Tonkeeper stores your cryptographic keys on your device',
  'Get started',
];

const EXPECTED_ADD_WALLET_TEXTS = [
  'Add Wallet',
  'Create a new wallet or add an existing one.',
  'New Wallet',
  'Create new wallet',
  'Existing Wallet',
  'Import wallet with a 24 or 12 secret recovery words',
  'New Multi-Wallet AccountBeta',
  'Manage multiple wallets with a single secret recovery phrase',
  'Watch Account',
  'For monitor wallet activity without recovery phrase',
  'Hardware Wallets',
  'Pair with Signer',
  'Completely offline, air-gapped, all TON features',
  'Pair with Ledger',
  'Hardware module, Bluetooth or USB-C, limited TON features',
  'Pair with Keystone',
  'A higher level of security with AIR-GAP hardware wallet',
  'Other Options',
  'Testnet Account',
  'Import wallet with a 24 secret recovery words to Testnet',
];

test('🚪 Welcome screen visibility', async ({ page }) => {
  await test.step('Открытие Welcome экрана', async () => {
    await page.goto('/');
  });

  await test.step('Проверка ключевых текстов и кнопок', async () => {
    for (const text of EXPECTED_WELCOME_TEXTS) {
      await expect(page.locator('#root')).toContainText(text);
    }
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  });
});

test('🧩 Add wallet screen visibility', async ({ page }) => {
  await test.step('Переход к экрану Add Wallet', async () => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
  });

  await test.step('Проверка основных опций добавления кошелька', async () => {
    for (const text of EXPECTED_ADD_WALLET_TEXTS) {
      await expect(page.locator('#react-portal-modal-container')).toContainText(text);
    }

    const buttons = [
      'New Wallet Create new wallet',
      'Existing Wallet Import wallet',
      'New Multi-Wallet Account Beta',
      'Watch Account For monitor',
      'Pair with Signer Completely',
      'Pair with Ledger Hardware',
      'Pair with Keystone A higher',
      'Testnet Account Import wallet',
    ];

    for (const name of buttons) {
      await expect(page.getByRole('button', { name })).toBeVisible();
    }
  });

  await test.step('Выход обратно на Welcome экран', async () => {
    await page.locator('.sc-kfzCjt').click();
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
  });
});
