import { test, expect } from '@playwright/test';

//generate new wallet flow(except seed phrase)
test('new wallet', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'New Wallet Create new wallet' }).click();
  await expect(page.getByRole('heading', { name: 'Generating wallet...' })).toBeVisible();
  await page.getByRole('button').nth(2).click();
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'New Wallet Create new wallet' }).click();
  await expect(page.getByRole('heading', { name: 'Your wallet has just been' })).toBeVisible();
  await expect(page.getByRole('button').nth(2)).toBeVisible();
  await expect(page.getByRole('button').nth(1)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Grab a pen and a piece of' })).toBeVisible();
  await expect(page.locator('h2')).toContainText('Grab a pen and a piece of paper');
  await expect(page.getByText('We strongly recommend you')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Grab a pen and a piece of paperWe strongly recommend you write down the recovery phrase because it’s the only way to have access to and recover your wallet in case of losing your device. Do not send it to yourself via email or take a screenshot. It’s safer when kept offline.');
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  //go step back
  await page.getByRole('button').nth(1).click();
  await page.getByRole('button', { name: 'New Wallet Create new wallet' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'Your recovery phrase' })).toBeVisible();
  await expect(page.getByText('Write down these 24 words in')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Write down these 24 words in the order given below and store them in a secret, safe place.');
  await expect(page.getByText('1.', { exact: true })).toBeVisible();
  await expect(page.getByText('13.')).toBeVisible();
  await expect(page.getByText('24.')).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('heading', { name: 'So, let’s check' })).toBeVisible();
  await expect(page.getByText('To check whether you’ve')).toBeVisible();
  //go step back
  await expect(page.getByRole('button').nth(1)).toBeVisible();
  await page.getByRole('button').nth(1).click();
  await expect(page.getByRole('heading', { name: 'Your recovery phrase' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button').nth(2).click();
  await expect(page.getByText('Are you sure you want to')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('Are you sure you want to leave?');
  await expect(page.getByText('You have unsaved changes. If')).toBeVisible();
  await expect(page.locator('#react-portal-modal-container')).toContainText('You have unsaved changes. If you close this window, your progress will be lost. Do you want to continue?');
  await expect(page.getByRole('button', { name: 'Continue Editing' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Discard Changes' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue Editing' }).click();
  await expect(page.getByText('To check whether you’ve')).toBeVisible();
  await page.getByRole('button').nth(2).click();
  await page.getByRole('button', { name: 'Discard Changes' }).click();
  await expect(page.getByText('Welcome to TonkeeperWorld-')).toBeVisible();
});