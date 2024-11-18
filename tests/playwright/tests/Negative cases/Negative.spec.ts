import { test, expect } from '@playwright/test';

//добавить кошелёк с неверной сидкой + попап Incorrect phrase +
//тексты и кнопки в модалке закрытия окошка видимы и называются корректно

test('Incorrect seed phrase ', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_ANANAS);
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Incorrect phrase')).toBeVisible();
    await page.locator('#react-portal-modal-container').getByRole('button').nth(1).click();
    await expect(page.getByText('Are you sure you want to')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue Editing' })).toBeVisible();
    await expect(page.locator('#react-portal-modal-container')).toContainText('Continue Editing');
    await expect(page.getByRole('button', { name: 'Discard Changes' })).toBeVisible();
    await expect(page.locator('#react-portal-modal-container')).toContainText('Discard Changes');
    await expect(page.locator('#react-portal-modal-container')).toContainText(
        'You have unsaved changes. If you close this window, your progress will be lost. Do you want to continue?'
    );
    await page.getByRole('button', { name: 'Discard Changes' }).click();
    await expect(page.getByRole('button', { name: 'Get started' })).toBeVisible();
});

//неверный пароль ввести 2 раза, ошибка Passwords do not match + ввод верного пароля +удаление кошелька

test('Incorrect password', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByRole('button', { name: '12 words' }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_12);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .locator('div')
        .filter({ hasText: /^Password$/ })
        .getByRole('textbox')
        .fill('123456');
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill('123457');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    await expect(page.locator('form')).toContainText('Passwords do not match.');
    await page.locator('div:nth-child(2) > .sc-gGmKOd').click();
    await page
        .getByText('Create passwordPasswordPasswords do not match.Re-enter passwordContinue')
        .click();
    await page.locator('div:nth-child(2) > .sc-gGmKOd').click();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill('1234');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Passwords do not match.')).toBeVisible();
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill('123456');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.goto('https://wallet.tonkeeper.com/wallet-settings');
    await page
        .locator('div')
        .filter({ hasText: /^Delete Account$/ })
        .nth(1)
        .click();
    await page.getByText('I have a backup copy of recovery phraseBack up now').click();
    await page
        .locator('div')
        .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
        .locator('div')
        .click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});
