import { expect, screenshot, test } from '../../../../../playwright/test';
import { FoldersHarness } from '../wallets/FoldersHarness';
import { SidebarHarness, SidebarStage } from './MultichainDesktopSidebarHarness';

// Edge cases the screenshot suite targets:
//   - the balance card splits the fractional part into the smaller size
//     and shows the account's shortened TON address with the switch
//     chevrons under the total;
//   - the wallet list renders the seeded account with its kind tag and
//     the active indicator line (rows come from the accounts state, not
//     the harness props — the fixture account is named "Multichain");
//   - a wallet row's caption is its fiat total, which no backend answers
//     under ct, so every row shows the placeholder dash;
//   - an unloaded total renders the placeholder dash in the balance card;
//   - the battery icon is absent (no battery balance is seeded) — the
//     battery branch is covered by the battery state hooks, not here.
// No folders are seeded, so the tab bar stays hidden and the plain
// ordered list renders.

screenshot('MultichainDesktopSidebar normal', () => (
    <SidebarStage>
        <SidebarHarness totalFiatStr="27345.15" />
    </SidebarStage>
));

screenshot('MultichainDesktopSidebar loading', () => (
    <SidebarStage>
        <SidebarHarness />
    </SidebarStage>
));

// Folder tabs: Personal (selected — holds the active account) | Work |
// Other; the list shows the selected folder's wallets with the active
// indicator line on "Everyday".
screenshot('MultichainDesktopSidebar folders', () => (
    <FoldersHarness>
        <SidebarStage>
            <SidebarHarness totalFiatStr="27345.15" />
        </SidebarStage>
    </FoldersHarness>
));

test('folder tabs switch the wallet list', async ({ mount }) => {
    const c = await mount(
        <FoldersHarness>
            <SidebarStage>
                <SidebarHarness totalFiatStr="27345.15" />
            </SidebarStage>
        </FoldersHarness>
    );

    // Personal is selected by default — it holds the active account.
    await expect(c).toContainText('Everyday');
    await expect(c).toContainText('Trading');
    await expect(c).not.toContainText('Savings');

    await c.getByRole('button', { name: 'Work' }).click();
    await expect(c).toContainText('Savings');
    await expect(c).not.toContainText('Everyday');

    // Loose wallets group under the implicit Other tab.
    await c.getByRole('button', { name: 'Other' }).click();
    await expect(c).toContainText('Tests');
});

test('MultichainDesktopSidebar renders the wallet list, total and menu', async ({ mount }) => {
    const c = await mount(
        <SidebarStage>
            <SidebarHarness totalFiatStr="27345.15" />
        </SidebarStage>
    );
    await expect(c).toContainText('Multichain');
    await expect(c).toContainText('$');
    // The balance card carries the shortened TON address (4…4).
    await expect(c.getByRole('button', { name: /…/ })).toBeVisible();
    await expect(c.getByRole('button', { name: 'Dashboard' })).toBeVisible();
    await expect(c.getByRole('button', { name: 'Manage Wallets' })).toBeVisible();
});

test('MultichainDesktopSidebar opens the receiving-address sheet from the balance card', async ({
    mount,
    page
}) => {
    const c = await mount(
        <SidebarStage>
            <SidebarHarness totalFiatStr="27345.15" />
        </SidebarStage>
    );
    await c.getByRole('button', { name: /…/ }).click();
    // The sheet portals outside the mounted subtree.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Receiving address');
    await expect(dialog).toContainText('One address per network');
});

test('MultichainDesktopSidebar opens the dashboard modal from Dashboard', async ({
    mount,
    page
}) => {
    const c = await mount(
        <SidebarStage>
            <SidebarHarness totalFiatStr="27345.15" />
        </SidebarStage>
    );
    await c.getByRole('button', { name: 'Dashboard' }).click();
    // The modal portals outside the mounted subtree. Its header renders
    // before any dashboard data resolves.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Dashboard');
    await expect(dialog).toContainText('Export .CSV');
    await expect(dialog).toContainText('Total balance');
});

test('MultichainDesktopSidebar opens the manage-wallets modal from Manage Wallets', async ({
    mount,
    page
}) => {
    const c = await mount(
        <SidebarStage>
            <SidebarHarness totalFiatStr="27345.15" />
        </SidebarStage>
    );
    await c.getByRole('button', { name: 'Manage Wallets' }).click();
    // The modal portals outside the mounted subtree.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('Manage Wallets');
    await expect(dialog).toContainText('New Folder');
});
