import { MigrationWalletRow, MigrationWalletRowData } from './MigrationPage';
import { MigrationWalletRowsHarness } from './MigrationWalletRowsHarness';
import { expect, screenshot, test } from '../../../../../playwright/test';

const savings: MigrationWalletRowData = {
    walletId: 'w-savings',
    accountId: 'a-savings',
    name: 'Savings',
    emoji: '🐝',
    versionLabel: 'v4R2',
    subtitle: '$ 137.16'
};

screenshot('Migration wallet rows', () => <MigrationWalletRowsHarness />);
screenshot('Migration wallet rows loading', () => <MigrationWalletRowsHarness loading />);

test('clicking a row selects it', async ({ mount }) => {
    let selected = '';
    const c = await mount(
        <MigrationWalletRow
            wallet={savings}
            selected={false}
            divider={false}
            onSelect={() => (selected = savings.walletId)}
        />
    );
    await c.getByRole('button', { name: /Savings/ }).click();
    expect(selected).toBe('w-savings');
});
