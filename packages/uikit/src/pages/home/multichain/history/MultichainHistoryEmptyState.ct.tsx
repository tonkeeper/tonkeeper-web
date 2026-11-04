import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainHistoryEmptyState } from './MultichainHistoryEmptyState';

const WRAP = 'flex w-[390px] justify-center bg-backgroundPage py-16';

screenshot('MultichainHistoryEmptyState with add funds', () => (
    <div className={WRAP}>
        <MultichainHistoryEmptyState onAddFunds={() => {}} />
    </div>
));

screenshot('MultichainHistoryEmptyState filtered no results', () => (
    <div className={WRAP}>
        <MultichainHistoryEmptyState filtered />
    </div>
));

test('filtered variant explains the filters and drops the CTA', async ({ mount }) => {
    const c = await mount(
        <div className={WRAP}>
            <MultichainHistoryEmptyState filtered />
        </div>
    );
    await expect(c).toContainText('Nothing matches the current filters.');
    await expect(c.getByRole('button')).toHaveCount(0);
});

test('fires onAddFunds', async ({ mount }) => {
    let clicked = 0;
    const c = await mount(
        <div className={WRAP}>
            <MultichainHistoryEmptyState onAddFunds={() => (clicked += 1)} />
        </div>
    );
    await c.getByRole('button').click();
    expect(clicked).toBe(1);
});
