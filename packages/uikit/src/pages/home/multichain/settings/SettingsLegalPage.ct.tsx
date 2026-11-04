import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { SettingsLegalPage } from './SettingsLegalPage';

screenshotEachMode('SettingsLegalPage', () => <SettingsLegalPage />);

// The mock sdk's `openPage` logs the url to the console, so the click
// target can be observed without a platform browser.
test('rows open the terms and privacy documents via sdk.openPage', async ({ mount, page }) => {
    const opened: string[] = [];
    page.on('console', message => opened.push(message.text()));
    const c = await mount(<SettingsLegalPage compact />);

    await c.getByRole('button', { name: 'Terms of service' }).click();
    await expect.poll(() => opened).toContain('https://tonkeeper.com/terms');

    await c.getByRole('button', { name: 'Privacy policy' }).click();
    await expect.poll(() => opened).toContain('https://tonkeeper.com/privacy');
});
