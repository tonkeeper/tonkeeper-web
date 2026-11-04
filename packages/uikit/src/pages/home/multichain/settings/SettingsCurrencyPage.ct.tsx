import type { Page } from 'playwright-core';
import type { Currency } from '@tonkeeper/core/dist/tonkeeperApiGenerated';
import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { SettingsCurrencyPage } from './SettingsCurrencyPage';

const currencies: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', image: '', type: 'fiat' },
    { code: 'EUR', symbol: '€', name: 'Euro', image: '', type: 'fiat' },
    { code: 'GBP', symbol: '£', name: 'British Pound', image: '', type: 'fiat' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', image: '', type: 'fiat' },
    { code: 'GRAM', symbol: 'GRAM', name: 'Gram', image: '', type: 'crypto' }
];

const mockCurrencies = async (page: Page) => {
    await page.route(/api\.tonkeeper\.com\/currencies(\?|$)/, route =>
        route.fulfill({ json: { currencies } })
    );
};

screenshotEachMode('SettingsCurrencyPage', () => <SettingsCurrencyPage />, undefined, {
    setupPage: mockCurrencies
});

test('clicking a currency moves the checkmark to the clicked row', async ({ mount, page }) => {
    await mockCurrencies(page);
    const c = await mount(<SettingsCurrencyPage />);
    const usd = c.getByRole('button', { name: /US Dollar/ });
    const eur = c.getByRole('button', { name: /Euro/ });

    await expect(usd.locator('svg')).toBeVisible();
    await expect(eur.locator('svg')).toHaveCount(0);

    await eur.click();

    await expect(eur.locator('svg')).toBeVisible();
    await expect(usd.locator('svg')).toHaveCount(0);
});

test('search filters by code and by name', async ({ mount, page }) => {
    await mockCurrencies(page);
    const c = await mount(<SettingsCurrencyPage />);
    const search = c.getByRole('searchbox');

    await search.fill('gbp');
    await expect(c.getByRole('button', { name: /British Pound/ })).toBeVisible();
    await expect(c.getByRole('button', { name: /Euro/ })).toHaveCount(0);

    await search.fill('dirham');
    await expect(c.getByRole('button', { name: /AED/ })).toBeVisible();
    await expect(c.getByRole('button', { name: /British Pound/ })).toHaveCount(0);

    await search.fill('zzz');
    await expect(c.getByText('Not Found')).toBeVisible();
});
