import { test, expect } from '@playwright/test';

//Add New Multi-Wallet Account (except seed phrase)
test('New multi wallet', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'New Multi-Wallet Account Beta' }).click();
  await expect(page.getByRole('heading', { name: 'Your wallet has just been' })).toBeVisible();
  await page.locator('div').filter({ hasText: /^Back$/ }).nth(1).click();
  await page.getByRole('button').nth(2).click();
  await page.getByRole('button', { name: 'Get started' }).click();
  await page.getByRole('button', { name: 'New Multi-Wallet Account Beta' }).click();
  await expect(page.getByRole('heading', { name: 'Grab a pen and a piece of' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue' }).click();
  //go step back
  await page.getByRole('button').nth(1).click();
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