import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { FoldersHarness } from './FoldersHarness';
import { ManageWalletsModal } from './ManageWalletsModal';

const noop = () => {};

// The ct fixture seeds one loose multichain account and no folders, so the
// list is a single wallet row with the edit pencil and drag handle, plus
// the Add Wallet / New Folder footer.

screenshotEachMode(
    'ManageWalletsModal',
    () => <ManageWalletsModal isOpen onClose={noop} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

// Folder rows: "Personal" expanded over Everyday + Trading, "Work"
// collapsed, and the loose "Tests" account grouped under the implicit
// "Other" folder pinned last.
screenshotEachMode(
    'ManageWalletsModal folders',
    () => (
        <FoldersHarness>
            <ManageWalletsModal isOpen onClose={noop} />
        </FoldersHarness>
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('folders expand and collapse from the header row', async ({ mount, page }) => {
    await mount(
        <FoldersHarness>
            <ManageWalletsModal isOpen onClose={noop} />
        </FoldersHarness>
    );
    const dialog = page.getByRole('dialog');

    // Personal starts expanded, Work collapsed.
    await expect(dialog).toContainText('Everyday');
    await expect(dialog).toContainText('Trading');
    await expect(dialog).not.toContainText('Savings');

    await dialog.getByRole('button', { name: 'Work' }).click();
    await expect(dialog).toContainText('Savings');

    await dialog.getByRole('button', { name: 'Personal' }).click();
    await expect(dialog).not.toContainText('Everyday');
});

test('loose wallets group under "Other" once a folder exists', async ({ mount, page }) => {
    await mount(
        <FoldersHarness>
            <ManageWalletsModal isOpen onClose={noop} />
        </FoldersHarness>
    );
    const dialog = page.getByRole('dialog');

    const other = dialog.getByRole('button', { name: 'Other' });
    await expect(other).toBeVisible();
    await expect(dialog).toContainText('Tests');

    await other.click();
    await expect(dialog).not.toContainText('Tests');
});

test('without folders there is no "Other" group', async ({ mount, page }) => {
    await mount(<ManageWalletsModal isOpen onClose={noop} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog).not.toContainText('Other');
});

test('lists the account with edit and drag affordances', async ({ mount, page }) => {
    await mount(<ManageWalletsModal isOpen onClose={noop} />);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Manage Wallets');
    await expect(dialog).toContainText('Multichain');
    await expect(dialog.getByRole('button', { name: 'Edit' })).toBeVisible();
});

test('New Folder opens the folder editor prefilled empty', async ({ mount, page }) => {
    await mount(<ManageWalletsModal isOpen onClose={noop} />);
    await page.getByRole('button', { name: 'New Folder' }).click();

    const editor = page.getByRole('dialog').last();
    await expect(editor).toContainText('New Folder');
    await expect(editor).toContainText('Folder Name');
    // No folder name and no selection yet — Save must be disabled.
    await expect(editor.getByRole('button', { name: 'Save' })).toBeDisabled();
});
