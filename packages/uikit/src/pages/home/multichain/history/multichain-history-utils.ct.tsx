import { expect, test } from '../../../../../playwright/test';
import { GroupProbe, TimestampProbe, TitleProbe } from './multichain-history-utils.probes';

test('row timestamp shows the date once the group header stops naming the day', async ({
    mount
}) => {
    const c = await mount(<TimestampProbe />);

    // Today / yesterday / this month: the group header already carries the day,
    // so the row is time-only (HH:mm, no date, no comma).
    await expect(c.getByTestId('ts-today')).toHaveText(/^\d{2}:\d{2}$/);
    await expect(c.getByTestId('ts-yesterday')).toHaveText(/^\d{2}:\d{2}$/);
    await expect(c.getByTestId('ts-same-month')).toHaveText(/^\d{2}:\d{2}$/);

    // Earlier month in this year: header is just "June", so the row spells out
    // the month + day (no year), e.g. `Jun 12, 09:30`.
    await expect(c.getByTestId('ts-earlier-month')).toHaveText(/^\w{3} \d{2}, \d{2}:\d{2}$/);
    await expect(c.getByTestId('ts-earlier-month')).not.toContainText('2026');

    // Earlier year: the row also carries the year, e.g. `Jun 12, 2025, 09:30`.
    await expect(c.getByTestId('ts-earlier-year')).toHaveText(/^\w{3} \d{2}, 2025, \d{2}:\d{2}$/);

    // Rows without a group header above them always carry the date.
    await expect(c.getByTestId('ts-today-with-date')).toHaveText(/^\w{3} \d{2}, \d{2}:\d{2}$/);
    await expect(c.getByTestId('ts-same-month-with-date')).toHaveText(/^\w{3} \d{2}, \d{2}:\d{2}$/);
});

test('same-month activities bucket per day; earlier months/years get one group each', async ({
    mount
}) => {
    const c = await mount(<GroupProbe />);
    // Two July days → two distinct `month-<day>` groups (proving same-month rows
    // are split by date), while the two June entries fall into their month/year
    // groups. Newest group first.
    await expect(c.getByTestId('group-keys')).toHaveText(
        'today,yesterday,month-8,month-3,year-2026-6,year-2025-6'
    );
});

test('group headers name the day for today/yesterday/this-month', async ({ mount }) => {
    const c = await mount(<TitleProbe />);
    await expect(c.getByTestId('title-today')).toHaveText('Today');
    await expect(c.getByTestId('title-yesterday')).toHaveText('Yesterday');
    // Current-month group header spells out the exact day.
    await expect(c.getByTestId('title-month')).toContainText('12');
    await expect(c.getByTestId('title-month')).toContainText('July');
});
