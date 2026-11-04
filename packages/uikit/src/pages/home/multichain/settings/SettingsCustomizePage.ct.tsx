import { expect, screenshot, test } from '../../../../../playwright/test';
import { SettingsCustomizePage } from './SettingsCustomizePage';

// The mount harness seeds an active multichain account named "Multichain"
// with the 🪐 emoji (playwright/multichainAccountFixture.ts).

screenshot('SettingsCustomizePage desktop', () => <SettingsCustomizePage />, 'desktop');
screenshot('SettingsCustomizePage mobile', () => <SettingsCustomizePage compact />, 'mobile');

test('typing a name updates the preview', async ({ mount }) => {
    const c = await mount(<SettingsCustomizePage compact />);
    await expect(c.getByText('Multichain')).toBeVisible();
    await c.getByRole('textbox').fill('Savings');
    await expect(c.getByText('Savings')).toBeVisible();
});

test('picking an emoji updates the avatar preview', async ({ mount }) => {
    const c = await mount(<SettingsCustomizePage compact />);
    const preview = c.getByTestId('customize-avatar-preview');
    await expect(preview).toHaveText('🪐');
    await c.getByText('😀', { exact: true }).click();
    await expect(preview).toHaveText('😀');
});

test('save is disabled while the name is empty', async ({ mount }) => {
    const c = await mount(<SettingsCustomizePage compact />);
    const save = c.getByRole('button', { name: 'Save' });
    await expect(save).toBeEnabled();
    await c.getByRole('textbox').fill('');
    await expect(save).toBeDisabled();
    await c.getByRole('textbox').fill('Renamed');
    await expect(save).toBeEnabled();
});
