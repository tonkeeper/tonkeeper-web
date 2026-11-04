import { ChartPeriod } from '../../../../state/trading/useAssetCharts';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainAssetPeriodSelector } from './MultichainAssetPeriodSelector';

// Edge cases the screenshot suite targets:
//   - selected period gets the secondary-background pill; the other five
//     stay transparent.
//   - first ('H') and last ('Y') selections sit at the row edges and must
//     not clip the rounded pill.

const FRAME = 'w-[390px] bg-backgroundPage';

screenshot('MultichainAssetPeriodSelector day selected', () => (
    <div className={FRAME}>
        <MultichainAssetPeriodSelector value="D" onChange={() => {}} />
    </div>
));

screenshot('MultichainAssetPeriodSelector first period selected', () => (
    <div className={FRAME}>
        <MultichainAssetPeriodSelector value="H" onChange={() => {}} />
    </div>
));

screenshot('MultichainAssetPeriodSelector last period selected', () => (
    <div className={FRAME}>
        <MultichainAssetPeriodSelector value="Y" onChange={() => {}} />
    </div>
));

test('MultichainAssetPeriodSelector fires onChange with the tapped period', async ({ mount }) => {
    let picked: ChartPeriod | undefined;
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetPeriodSelector value="D" onChange={p => (picked = p)} />
        </div>
    );
    await c.getByRole('button', { name: 'W' }).click();
    expect(picked).toBe('W');
});

test('MultichainAssetPeriodSelector highlights the active pill after selection', async ({
    mount
}) => {
    let picked: ChartPeriod = 'D';
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetPeriodSelector value={picked} onChange={p => (picked = p)} />
        </div>
    );
    await c.getByRole('button', { name: '6M' }).click();
    await c.update(
        <div className={FRAME}>
            <MultichainAssetPeriodSelector value={picked} onChange={() => {}} />
        </div>
    );
    await expect(c.getByRole('button', { name: '6M' })).toHaveClass(/bg-buttonSecondaryBackground/);
});
