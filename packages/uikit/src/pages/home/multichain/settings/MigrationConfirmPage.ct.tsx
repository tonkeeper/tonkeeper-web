import { MigrationConfirmRow } from './MigrationConfirmPage';
import { MigrationConfirmRowsHarness } from './MigrationConfirmRowsHarness';
import { expect, screenshot, test } from '../../../../../playwright/test';

const rows = [
    {
        key: 'a',
        title: 'Send',
        subtitle: 'EQAK…MALX',
        value: '1,523.15 TON',
        fiat: '$ 0.001'
    },
    {
        key: 'b',
        title: 'Send',
        subtitle: 'EQAK…MALX',
        value: '1,567.45 USD₮',
        fiat: '$ 1,567.25'
    },
    {
        key: 'c',
        title: 'Send',
        subtitle: 'EQAK…MALX',
        value: 'NFT'
    }
];

screenshot('Migration confirm rows', () => (
    <div className="max-w-[420px] overflow-hidden rounded-medium bg-backgroundContent">
        {rows.map((row, index) => (
            <MigrationConfirmRow key={row.key} row={row} divider={index > 0} />
        ))}
    </div>
));

test('builds TRON rows from the plan and skips zero legs', async ({ mount }) => {
    const component = await mount(<MigrationConfirmRowsHarness />);
    // The zero TRX sweep leg yields no row, so the USDT transfer is the only one.
    await expect(component.getByText('Send')).toHaveCount(1);
    await expect(component.getByText('TGzz…swVp')).toBeVisible();
});

test('keeps truncated cents on amounts and fiat above 1000', async ({ mount }) => {
    const component = await mount(<MigrationConfirmRowsHarness />);
    await expect(component.getByText('20,137.16 USD₮')).toBeVisible();
    await expect(component.getByText('$ 20,137.16')).toBeVisible();
});
