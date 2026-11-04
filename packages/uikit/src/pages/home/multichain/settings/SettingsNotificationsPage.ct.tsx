import { expect, screenshot, screenshotEachMode, test } from '../../../../../playwright/test';
import { SettingsNotificationsView } from './SettingsNotificationsPage';

const noop = () => {};
const CAPTION = 'Get notifications when you receive TON, tokens and NFTs.';

screenshotEachMode('SettingsNotificationsView subscribed', () => (
    <SettingsNotificationsView subscribed caption={CAPTION} onToggle={noop} onBack={noop} />
));

screenshot('SettingsNotificationsView unsubscribed', () => (
    <SettingsNotificationsView subscribed={false} caption={CAPTION} onToggle={noop} onBack={noop} />
));

test('toggle reports the next subscription state', async ({ mount }) => {
    let next: boolean | undefined;
    const c = await mount(
        <SettingsNotificationsView
            subscribed={false}
            caption={CAPTION}
            onToggle={v => (next = v)}
            onBack={noop}
        />
    );
    await c.getByRole('switch').click();
    expect(next).toBe(true);
});

test('toggle is locked while the subscription request is in flight', async ({ mount }) => {
    const c = await mount(
        <SettingsNotificationsView
            subscribed
            disabled
            caption={CAPTION}
            onToggle={noop}
            onBack={noop}
        />
    );
    const toggle = c.getByRole('switch');
    await expect(toggle).toBeDisabled();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
});
