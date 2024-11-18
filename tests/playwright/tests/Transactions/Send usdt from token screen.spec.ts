import { test, expect } from '@playwright/test';

//отправка usdt с экрана токена + подтверждаем успех транзакции появлением Done

test('test', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_ANANAS);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page
        .locator('div')
        .filter({ hasText: /^Password$/ })
        .getByRole('textbox')
        .fill('123456');
    await page.getByRole('textbox').nth(1).click();
    await page.getByRole('textbox').nth(1).fill('123456');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill('Ananas');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.locator('div:nth-child(10) > .sc-dOSSlk > .sc-isYNRO').click();
    await page.getByRole('button', { name: 'Send' }).nth(2).click();
    await page.getByRole('textbox').first().click();
    await page
        .getByRole('textbox')
        .first()
        .fill('UQD2NmD_lH5f5u1Kj3KfGyTvhZSX0Eg6qp2a5IQUKXxOGzCi');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByText('USD₮', { exact: true }).nth(2).click();
    await page.getByLabel('USD₮USD₮0,00 USD').fill('0,01');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Confirm and Send' }).click();
    await page.locator('#react-portal-modal-container').getByRole('textbox').fill('123456');
    await expect(page.getByRole('button', { name: 'Confirm' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(page.getByText('Done')).toBeVisible();
});
