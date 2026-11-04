import { expect, screenshot, screenshotEachMode, test } from '../../../../../playwright/test';
import { SettingsSecurityPage } from './SettingsSecurityPage';
import { PasswordProfileHarness } from './SettingsSecurityPageHarness';

screenshotEachMode(
    'SettingsSecurityPage',
    () => (
        <PasswordProfileHarness>
            <SettingsSecurityPage />
        </PasswordProfileHarness>
    ),
    ['desktop']
);

screenshotEachMode(
    'SettingsSecurityPage',
    () => (
        <PasswordProfileHarness>
            <SettingsSecurityPage compact />
        </PasswordProfileHarness>
    ),
    ['mobile']
);

screenshot('SettingsSecurityPage without app password', () => <SettingsSecurityPage />);

test('lock screen switch flips and persists the toggle', async ({ mount }) => {
    const c = await mount(
        <PasswordProfileHarness>
            <SettingsSecurityPage />
        </PasswordProfileHarness>
    );

    const lockSwitch = c.getByRole('switch').first();
    await expect(lockSwitch).toHaveAttribute('aria-checked', 'false');
    await lockSwitch.click();
    await expect(lockSwitch).toHaveAttribute('aria-checked', 'true');
});

test('safe mode switch-off is temporary and offers turning off permanently', async ({ mount }) => {
    const c = await mount(
        <PasswordProfileHarness>
            <SettingsSecurityPage />
        </PasswordProfileHarness>
    );

    // Second switch on the page: lock screen first, safe mode second.
    const safeModeSwitch = c.getByRole('switch').nth(1);
    await expect(safeModeSwitch).toHaveAttribute('aria-checked', 'false');

    await safeModeSwitch.click();
    await expect(safeModeSwitch).toHaveAttribute('aria-checked', 'true');

    await safeModeSwitch.click();
    await expect(safeModeSwitch).toHaveAttribute('aria-checked', 'false');
    await expect(c.getByText('Safe mode is off for 24 hours', { exact: false })).toBeVisible();

    await c.getByText('Turn off permanently').click();
    await expect(c.getByText('Safe mode is off for 24 hours', { exact: false })).not.toBeVisible();
    await expect(safeModeSwitch).toHaveAttribute('aria-checked', 'false');
});

test('change password row opens the change password form', async ({ mount, page }) => {
    const c = await mount(
        <PasswordProfileHarness>
            <SettingsSecurityPage />
        </PasswordProfileHarness>
    );

    await c.getByText('Change password').click();
    await expect(page.getByText('Current password')).toBeVisible();
});
