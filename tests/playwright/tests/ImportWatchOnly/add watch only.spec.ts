import { test, expect } from '@playwright/test';

test.setTimeout(4 * 60 * 1000);

async function startWatchFlow(page: any, input: string, label: string, emoji?: string) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Watch Account For monitor' }).click();
    await page.getByRole('textbox').fill(input);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('textbox').fill(label);
    if (emoji) await page.getByText(emoji).click();
    await page.getByRole('button', { name: 'Save' }).click();
}

async function deleteAccount(page: any) {
    await page.getByRole('link', { name: 'Settings' }).click();
    const deleteButton = await page.locator('div').filter({ hasText: /^Delete Account$/ }).nth(1);
    await deleteButton.click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
}

test('📡 Watch-only wallet — DNS name', async ({ page }) => {
    await test.step('Добавление через DNS', async () => {
        await startWatchFlow(page, 'oleganza.ton', 'test name', '💚');
    });
    await test.step('Удаление кошелька', async () => {
        await deleteAccount(page);
    });
});

test('📡 Watch-only wallet — by address', async ({ page }) => {
    await test.step('Добавление по адресу', async () => {
        await startWatchFlow(page, 'UQAgxzj9H34-cZwyNZMai8I7Ghzko1XbIAKAVqIHD6m3fZvV', 'watch only', '💟');
    });
    await test.step('Удаление кошелька', async () => {
        await deleteAccount(page);
    });
});

test('📡 Watch-only wallet — by hex string', async ({ page }) => {
    await test.step('Добавление по hex', async () => {
        await startWatchFlow(
            page,
            '0:14d76eaec79a0ae126f90e012dc9622e27492e7aad8e51ac20ebf618cad392b3',
            'watch only by hex'
        );
    });
    await test.step('Удаление кошелька', async () => {
        await deleteAccount(page);
    });
});
