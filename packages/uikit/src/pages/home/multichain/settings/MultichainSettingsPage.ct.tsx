import { MultichainSettingsPage } from './MultichainSettingsPage';
import { expect, screenshot, test } from '../../../../../playwright/test';

// Desktop (compact shell) has no header; mobile shows back + title. Rows
// gated on sdk/config capabilities (Notifications, Battery, FAQ, News,
// Rate) stay hidden under the ct providers.
screenshot('Settings landing desktop', () => <MultichainSettingsPage compact />, 'desktop');
screenshot('Settings landing mobile', () => <MultichainSettingsPage />, 'mobile');

test('support row opens the Need help sheet', async ({ mount, page }) => {
    const c = await mount(<MultichainSettingsPage compact />);
    await c.getByRole('button', { name: 'Support' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Need help?')).toBeVisible();
});

test('sign out row opens the confirmation sheet', async ({ mount, page }) => {
    const c = await mount(<MultichainSettingsPage compact />);
    await c.getByRole('button', { name: /Sign Out/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
});
