import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { SettingsDevPage } from './SettingsDevPage';

// Rows gated on sdk capabilities (cookies, logger) and platform (reviewer
// mode, dev-pro toggle) stay hidden under the ct providers, leaving the
// SK import row.
screenshotEachMode('SettingsDevPage', () => <SettingsDevPage />);

test('capability-gated rows are hidden without sdk services', async ({ mount }) => {
    const c = await mount(<SettingsDevPage compact />);
    await expect(c.getByRole('button', { name: 'Add account with private key' })).toBeVisible();
    await expect(c.getByText('Clean All Cookies')).toHaveCount(0);
    await expect(c.getByText('Dev Logs')).toHaveCount(0);
    await expect(c.getByText('Enable extra security')).toHaveCount(0);
});
