import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { DeleteAccountSheet } from './DeleteAccountSheet';

screenshotEachMode(
    'DeleteAccountSheet',
    () => <DeleteAccountSheet isOpen onClose={() => {}} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('DeleteAccountSheet confirm stays disabled until the backup checkbox is checked', async ({
    mount,
    page
}) => {
    await mount(<DeleteAccountSheet isOpen onClose={() => {}} />);

    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: 'Delete wallet data' });
    const checkbox = dialog.getByRole('checkbox');

    await expect(confirm).toBeDisabled();
    await checkbox.click();
    await expect(confirm).toBeEnabled();
    await checkbox.click();
    await expect(confirm).toBeDisabled();
});

test('DeleteAccountSheet "Back up now" closes the sheet', async ({ mount, page }) => {
    let closed = false;
    await mount(<DeleteAccountSheet isOpen onClose={() => (closed = true)} />);

    await page.getByRole('dialog').getByRole('button', { name: 'Back up now' }).click();

    expect(closed).toBe(true);
});
