import type { Page } from 'playwright-core';

import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { FoldersHarness } from './FoldersHarness';
import { WalletSwitcherSheet } from './WalletSwitcherSheet';

const noop = () => {};

// Edge cases the screenshot suite targets:
//   - the seeded multichain account renders with its kind tag and the
//     account's fiat total as the caption;
//   - the active account carries the checkmark accessory;
//   - "Edit" swaps the same list for the manage view — pencil and drag
//     handle per row, plus the New Folder button next to Add Wallet.

screenshotEachMode(
    'WalletSwitcherSheet',
    () => <WalletSwitcherSheet isOpen onClose={noop} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

const startEditing = async (_component: unknown, page: Page) => {
    await page.getByRole('dialog').getByRole('button', { name: 'Edit', exact: true }).click();
};

screenshotEachMode(
    'WalletSwitcherSheet editing',
    () => <WalletSwitcherSheet isOpen onClose={noop} />,
    ['desktop', 'mobile'],
    { target: 'dialog', interact: startEditing }
);

// Folder rows: "Personal" expanded over Everyday + Trading, "Work"
// collapsed, and the loose "Tests" account as a top-level row.
screenshotEachMode(
    'WalletSwitcherSheet editing folders',
    () => (
        <FoldersHarness>
            <WalletSwitcherSheet isOpen onClose={noop} />
        </FoldersHarness>
    ),
    ['desktop', 'mobile'],
    { target: 'dialog', interact: startEditing }
);

test('WalletSwitcherSheet lists the active account and the add-wallet entry', async ({
    mount,
    page
}) => {
    await mount(<WalletSwitcherSheet isOpen onClose={noop} />);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Wallets');
    await expect(dialog.getByRole('button', { name: /Multichain/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Add Wallet' })).toBeVisible();
    // Row caption is the account's fiat total, not its address.
    await expect(dialog).toContainText('$ 17,471');
});

test('the row keeps its balance caption while editing', async ({ mount, page }) => {
    await mount(<WalletSwitcherSheet isOpen onClose={noop} />);
    const dialog = page.getByRole('dialog');

    await dialog.getByRole('button', { name: 'Edit', exact: true }).click();

    await expect(dialog).toContainText('$ 17,471');
});

test('Edit turns the rows into edit affordances in the same sheet', async ({ mount, page }) => {
    await mount(<WalletSwitcherSheet isOpen onClose={noop} />);

    await page.getByRole('dialog').getByRole('button', { name: 'Edit', exact: true }).click();

    // No second modal — the one sheet stays and gains the manage list.
    await expect(page.getByRole('dialog')).toHaveCount(1);
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Done', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'New Folder' })).toBeVisible();
    // The pencil per row carries the Edit label once the toggle reads Done.
    await expect(dialog.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
});

test('Done returns the sheet to the switcher', async ({ mount, page }) => {
    await mount(<WalletSwitcherSheet isOpen onClose={noop} />);
    const dialog = page.getByRole('dialog');

    await dialog.getByRole('button', { name: 'Edit', exact: true }).click();
    await dialog.getByRole('button', { name: 'Done', exact: true }).click();

    await expect(dialog.getByRole('button', { name: 'New Folder' })).toBeHidden();
    await expect(dialog.getByRole('button', { name: /Multichain/ })).toBeVisible();
});

test('folders expand and collapse from the header row while editing', async ({ mount, page }) => {
    await mount(
        <FoldersHarness>
            <WalletSwitcherSheet isOpen onClose={noop} />
        </FoldersHarness>
    );
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Edit', exact: true }).first().click();

    // Personal starts expanded, Work collapsed.
    await expect(dialog).toContainText('Everyday');
    await expect(dialog).toContainText('Trading');
    await expect(dialog).not.toContainText('Savings');

    await dialog.getByRole('button', { name: 'Work' }).click();
    await expect(dialog).toContainText('Savings');

    await dialog.getByRole('button', { name: 'Personal' }).click();
    await expect(dialog).not.toContainText('Everyday');
});

test('New Folder opens the folder editor prefilled empty', async ({ mount, page }) => {
    await mount(<WalletSwitcherSheet isOpen onClose={noop} />);
    await page.getByRole('dialog').getByRole('button', { name: 'Edit', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'New Folder' }).click();

    const editor = page.getByRole('dialog').last();
    await expect(editor).toContainText('Folder Name');
    // No folder name and no selection yet — Save must be disabled.
    await expect(editor.getByRole('button', { name: 'Save' })).toBeDisabled();
});

test('WalletSwitcherSheet closes when the add-wallet flow opens', async ({ mount, page }) => {
    let closed = false;
    await mount(<WalletSwitcherSheet isOpen onClose={() => (closed = true)} />);

    await page.getByRole('dialog').getByRole('button', { name: 'Add Wallet' }).click();

    expect(closed).toBe(true);
});

test('WalletSwitcherSheet closes when the active account is picked again', async ({
    mount,
    page
}) => {
    let closed = false;
    await mount(<WalletSwitcherSheet isOpen onClose={() => (closed = true)} />);

    await page
        .getByRole('dialog')
        .getByRole('button', { name: /Multichain/ })
        .click();

    expect(closed).toBe(true);
});
