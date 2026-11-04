import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { SettingsBackupPage, SettingsBackupView } from './SettingsBackupPage';

const MNEMONIC_24 = (
    'abandon ability able about above absent absorb abstract absurd abuse access accident ' +
    'account accuse achieve acid acoustic acquire across act action actor actress actual'
).split(' ');

const MNEMONIC_12 = MNEMONIC_24.slice(0, 12);

screenshotEachMode('SettingsBackupPage revealed phrase', () => (
    <SettingsBackupView mnemonic={MNEMONIC_24} />
));

screenshotEachMode(
    'SettingsBackupPage revealed phrase 12 words',
    () => <SettingsBackupView mnemonic={MNEMONIC_12} />,
    ['mobile']
);

test('renders every word numbered and the 24-word caution', async ({ mount }) => {
    const c = await mount(<SettingsBackupView mnemonic={MNEMONIC_24} />);
    await expect(c.getByText('Your recovery phrase')).toBeVisible();
    // Copy uses NBSP between the count and "words" (`24\u00a0words`).
    await expect(c.getByText(/24\swords/)).toBeVisible();
    await expect(c.getByText('1.', { exact: true })).toBeVisible();
    await expect(c.getByText('24.', { exact: true })).toBeVisible();
    await expect(c.getByText('abandon')).toBeVisible();
    await expect(c.getByText('actual')).toBeVisible();
});

test('12-word phrase shows the 12-word caution', async ({ mount }) => {
    const c = await mount(<SettingsBackupView mnemonic={MNEMONIC_12} />);
    await expect(c.getByText(/12\swords/)).toBeVisible();
    await expect(c.getByText('12.', { exact: true })).toBeVisible();
    await expect(c.getByText('13.', { exact: true })).toHaveCount(0);
});

test('copy button hands the joined phrase to the sdk clipboard', async ({ mount, page }) => {
    // MockAppSdk.copyToClipboard logs the copied value via console.debug,
    // which is the observable side effect available under ct.
    const debugMessages: string[] = [];
    page.on('console', message => {
        if (message.type() === 'debug') {
            debugMessages.push(message.text());
        }
    });

    const c = await mount(<SettingsBackupView mnemonic={MNEMONIC_24} />);
    await c.getByRole('button', { name: 'Copy' }).click();

    await expect.poll(() => debugMessages.some(m => m.includes(MNEMONIC_24.join(' ')))).toBe(true);
});

test('page stays on the guard state until the unlock flow resolves', async ({ mount }) => {
    // The ct fixture account is keychain-backed and MockAppSdk exposes no
    // keychain, so the unlock flow cannot complete under ct: the page must
    // keep showing the pre-reveal loader and never leak a phrase.
    const c = await mount(<SettingsBackupPage />);
    await expect(c.getByRole('progressbar')).toBeVisible();
    await expect(c.getByText('Your recovery phrase')).toHaveCount(0);
});
