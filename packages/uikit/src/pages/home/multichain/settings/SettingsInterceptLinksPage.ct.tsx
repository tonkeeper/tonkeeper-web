import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { SettingsInterceptLinksPage } from './SettingsInterceptLinksPage';
import { LinksInterceptorHarness } from './SettingsInterceptLinksPageHarness';

screenshotEachMode('SettingsInterceptLinksPage', () => (
    <LinksInterceptorHarness>
        <SettingsInterceptLinksPage />
    </LinksInterceptorHarness>
));

test('clicking an option moves the checkmark to the clicked row', async ({ mount }) => {
    const c = await mount(
        <LinksInterceptorHarness>
            <SettingsInterceptLinksPage />
        </LinksInterceptorHarness>
    );
    const ask = c.getByRole('button', { name: 'Always Ask' });
    const browser = c.getByRole('button', { name: 'Open in Browser' });

    await expect(ask.locator('svg')).toBeVisible();
    await expect(browser.locator('svg')).toHaveCount(0);

    await browser.click();

    await expect(browser.locator('svg')).toBeVisible();
    await expect(ask.locator('svg')).toHaveCount(0);
});

test('renders nothing without a links interceptor', async ({ mount }) => {
    const c = await mount(<SettingsInterceptLinksPage />);
    await expect(c.getByRole('button')).toHaveCount(0);
});
