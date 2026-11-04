import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { EmulatedActionsCard } from './TonConnectTransactionSheet';

const previews = [
    {
        name: 'Send Jetton',
        description: 'Transferring 25 USD₮ to EQBvW8Z5huBkMJYdnfAEM5JqTNkuWX3diqYENkWsIL0XggGG',
        value: '25 USD₮',
        accounts: []
    },
    {
        name: 'Smart contract execution',
        description: 'Calling the contract EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        accounts: []
    }
];

screenshotEachMode(
    'EmulatedActionsCard',
    () => (
        <div className="w-[358px]">
            <EmulatedActionsCard previews={previews} />
        </div>
    ),
    ['desktop', 'mobile']
);

test('lists each emulated action with its value when the preview has one', async ({ mount }) => {
    const c = await mount(
        <div className="w-[358px]">
            <EmulatedActionsCard previews={previews} />
        </div>
    );
    await expect(c.getByText('Send Jetton')).toBeVisible();
    await expect(c.getByText('25 USD₮', { exact: true })).toBeVisible();
    await expect(c.getByText('Smart contract execution')).toBeVisible();
});
