import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { SignOutSheet } from './SignOutSheet';

screenshotEachMode(
    'SignOutSheet',
    () => <SignOutSheet isOpen onClose={() => {}} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('SignOutSheet confirm stays disabled until the backup checkbox is checked', async ({
    mount,
    page
}) => {
    await mount(<SignOutSheet isOpen onClose={() => {}} />);

    const dialog = page.getByRole('dialog');
    const confirm = dialog.getByRole('button', { name: 'Sign Out', exact: true });
    const checkbox = dialog.getByRole('checkbox');

    await expect(confirm).toBeDisabled();
    await checkbox.click();
    await expect(confirm).toBeEnabled();
    await checkbox.click();
    await expect(confirm).toBeDisabled();
});

test('SignOutSheet "Back up now" closes the sheet without toggling the checkbox', async ({
    mount,
    page
}) => {
    let closed = false;
    await mount(<SignOutSheet isOpen onClose={() => (closed = true)} />);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Back up now' }).click();

    expect(closed).toBe(true);
    await expect(dialog.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
});
