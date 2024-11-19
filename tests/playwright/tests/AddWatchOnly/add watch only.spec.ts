import { test, expect } from '@playwright/test';

// by dns

test('watch only by dns', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Watch Account For monitor' }).click();
    await page.getByRole('textbox').fill('oleganza.ton');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('textbox').fill('test name');
    await page.locator('div:nth-child(1664)').click();
    await page.getByText('💚').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page
        .locator('div')
        .filter({ hasText: /^Delete Account$/ })
        .nth(1)
        .click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});

// by address

test('watch only by address', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Watch Account For monitor' }).click();
    await page.getByRole('textbox').fill('UQAgxzj9H34-cZwyNZMai8I7Ghzko1XbIAKAVqIHD6m3fZvV');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('watch only');
    await page.getByText('💟').click();
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByText('Delete Account').click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});

//by hex

test('watch only by hex', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Watch Account For monitor' }).click();
    await page.getByRole('textbox').fill('https://wallet.tonkeeper.com/');
    await page.getByRole('textbox').click();
    await page.getByRole('textbox').fill('');
    await page.getByRole('textbox').click();
    await page
        .getByRole('textbox')
        .fill('0:14d76eaec79a0ae126f90e012dc9622e27492e7aad8e51ac20ebf618cad392b3');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('textbox').fill('watch only by hex');
    await page.getByRole('button', { name: 'Save' }).click();
    await page.getByRole('link', { name: 'Settings' }).click();
    await page
        .locator('div')
        .filter({ hasText: /^Delete Account$/ })
        .nth(1)
        .click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});
