import { MigrationHowItWorksSheet } from './MigrationHowItWorksSheet';
import { expect, screenshotEachMode, test } from '../../../../../playwright/test';

screenshotEachMode(
    'Migration how-it-works sheet',
    () => <MigrationHowItWorksSheet isOpen onClose={() => {}} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('OK closes the sheet', async ({ mount, page }) => {
    let closed = false;
    await mount(<MigrationHowItWorksSheet isOpen onClose={() => (closed = true)} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('How migration works')).toBeVisible();
    await dialog.getByRole('button', { name: 'Ok' }).click();
    expect(closed).toBe(true);
});
