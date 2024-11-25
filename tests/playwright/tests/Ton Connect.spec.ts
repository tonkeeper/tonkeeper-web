import { test, expect, Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Get started' }).click();
    await page.getByRole('button', { name: 'Existing Wallet Import wallet' }).click();
    await page.getByLabel('1:', { exact: true }).click();
    await page.getByLabel('1:', { exact: true }).fill(process.env.TON_MNEMONIC_24);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.locator('#create-password').fill('123456');
    await page.locator('#create-password-confirm').fill('123456');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
});

test.afterEach(async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.getByText('Delete Account').click();
    await page
        .locator('div')
        .filter({ hasText: /^I have a backup copy of recovery phrase$/ })
        .locator('div')
        .click();
    await page.getByRole('button', { name: 'Delete wallet data' }).click();
});

const connectUrl = async (page: Page, clipboardContent: string) => {
    if (process.env.BASE_APP_URL === 'https://wallet.tonkeeper.com') {
        await page.goto(clipboardContent);
        await page.getByRole('link', { name: 'Sign in with Tonkeeper Web' }).click();
    } else {
        await page.goto(`/ton-connect${new URL(clipboardContent).search}`);
    }
};

//TON Connect + go to the settings => Connected Apps + check asserts and elements

test.describe('ton connect', () => {
    test('elements', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        await page.getByText('Discover').click();

        const page1Promise = page.waitForEvent('popup');

        await page.getByText('STON.fi').nth(2).click();

        // wait new page
        const page1 = await page1Promise;

        await page1.getByRole('button', { name: 'Connect wallet' }).click();
        await page1.getByRole('button', { name: 'Tonkeeper Popular' }).click();
        await page1.locator('.go1369062826').first().click();

        // get copied link
        const handle = await page1.evaluateHandle(() => navigator.clipboard.readText());
        const clipboardContent = await handle.jsonValue();

        // navigate back to wallet
        await connectUrl(page, clipboardContent);

        const modal = page.locator('#react-portal-modal-container').getByText('UQAG…gyIO');
        await expect(modal).toBeVisible();

        await expect(page.locator('form')).toContainText('UQAG…gyIO');
        await page.getByRole('button', { name: 'Connect wallet' }).click();
        await page.getByRole('link', { name: 'Settings' }).click();
        await page.getByRole('link', { name: 'Connected Apps' }).click();
        await expect(page.getByText('app.ston.fi')).toBeVisible();
        await expect(page.getByRole('listitem')).toContainText('app.ston.fi');
        await expect(page.getByRole('listitem')).toContainText('Disconnect');
        await page
            .locator('div')
            .filter({ hasText: /^Connected Apps$/ })
            .getByRole('button')
            .click();
    });

    test('STON fi', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        await page.getByText('Discover').click();
        const page1Promise = page.waitForEvent('popup');

        await page.getByText('STON.fi').nth(2).click();
        // wait new page
        const page1 = await page1Promise;

        await page1.getByRole('button', { name: 'Connect wallet' }).click();
        await page1.getByRole('button', { name: 'Tonkeeper Popular' }).click();
        await page1.locator('.go1369062826').first().click();

        // get copied link
        const handle = await page1.evaluateHandle(() => navigator.clipboard.readText());
        const clipboardContent = await handle.jsonValue();

        // navigate back to wallet
        await connectUrl(page, clipboardContent);

        const modal = page.locator('#react-portal-modal-container').getByText('UQAG…gyIO');
        await expect(modal).toBeVisible();

        await page.getByRole('button', { name: 'Connect wallet' }).click();

        await expect(modal).not.toBeVisible();
    });

    test('Getgems', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);

        await page.getByText('Discover').click();
        const page1Promise = page.waitForEvent('popup');

        const link = page.getByText('Getgems').nth(1); // second
        await link.scrollIntoViewIfNeeded();
        await link.click();

        const page1 = await page1Promise;

        await page1.getByRole('button', { name: 'Connect wallet' }).click();
        await page1.getByRole('button', { name: 'Tonkeeper Popular' }).click();

        const buttonOnGetGems = page1.locator('.go1369062826').first();
        await buttonOnGetGems.click();

        // get copied link
        const handle = await page1.evaluateHandle(() => navigator.clipboard.readText());
        const clipboardContent = await handle.jsonValue();

        // navigate back to wallet
        await connectUrl(page, clipboardContent);

        const modal = page.locator('#react-portal-modal-container').getByText('UQAG…gyIO');
        await expect(modal).toBeVisible();

        await page.getByRole('button', { name: 'Connect wallet' }).click();
        await page.locator('#react-portal-modal-container').getByRole('textbox').fill('123456');
        await page.getByRole('button', { name: 'Confirm' }).click();

        await expect(modal).not.toBeVisible();

        await page.getByRole('link', { name: 'Settings' }).click();
        await page.getByRole('link', { name: 'Connected Apps' }).click();
        await expect(page.getByText('getgems.io')).toBeVisible();

        // Expect that ton connect dialog auto closed, when it get event from http bridge
        await expect(buttonOnGetGems).not.toBeAttached();

        await expect(page.getByRole('button', { name: 'Disconnect' })).toBeVisible();
        await expect(page.getByRole('listitem')).toContainText('Disconnect');
    });
});
