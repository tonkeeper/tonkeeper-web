import { SupportSheet } from './SupportSheet';
import { expect, screenshotEachMode, test } from '../../../../../playwright/test';

screenshotEachMode(
    'Support sheet',
    () => <SupportSheet isOpen onClose={() => {}} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('renders both support channels and closes', async ({ mount, page }) => {
    let closed = false;
    await mount(<SupportSheet isOpen onClose={() => (closed = true)} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Ask on Telegram' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Contact by Email' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Ask on Telegram' }).click();
    expect(closed).toBe(true);
});

test('email copies the support address, opens the mailto and closes', async ({ mount, page }) => {
    // MockAppSdk logs copied values and opened urls via console.debug.
    const debugMessages: string[] = [];
    page.on('console', message => {
        if (message.type() === 'debug') {
            debugMessages.push(message.text());
        }
    });

    let closed = false;
    await mount(<SupportSheet isOpen onClose={() => (closed = true)} />);
    await page.getByRole('dialog').getByRole('button', { name: 'Contact by Email' }).click();

    await expect
        .poll(() =>
            debugMessages.some(m => m.startsWith('support@tonkeeper.com Email address copied'))
        )
        .toBe(true);
    await expect.poll(() => debugMessages.includes('mailto:support@tonkeeper.com')).toBe(true);
    expect(closed).toBe(true);
});
