import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { FolderModal } from './FolderModal';

const noop = () => {};

screenshotEachMode(
    'FolderModal create',
    () => <FolderModal isOpen onClose={noop} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('Save enables once a name is set and a wallet is checked', async ({ mount, page }) => {
    await mount(<FolderModal isOpen onClose={noop} />);
    const dialog = page.getByRole('dialog');
    const save = dialog.getByRole('button', { name: 'Save' });

    await expect(save).toBeDisabled();

    await dialog.getByLabel('Folder Name').fill('Work');
    await expect(save).toBeDisabled();

    await dialog.getByRole('button', { name: /Multichain/ }).click();
    await expect(save).toBeEnabled();
});

test('toggling a wallet row flips its checkbox back off', async ({ mount, page }) => {
    await mount(<FolderModal isOpen onClose={noop} />);
    const dialog = page.getByRole('dialog');
    const row = dialog.getByRole('button', { name: /Multichain/ });

    await dialog.getByLabel('Folder Name').fill('Work');
    await row.click();
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeEnabled();

    await row.click();
    await expect(dialog.getByRole('button', { name: 'Save' })).toBeDisabled();
});
