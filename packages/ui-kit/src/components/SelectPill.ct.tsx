import { expect, screenshot, test } from '../../playwright/test';
import { SelectPillHarness } from './SelectPillHarness';

// Edge cases the screenshot suite targets:
//   - both pill surfaces: the 32px secondary pill with a leading glyph and the
//     36px floating tertiary one.
//   - the menu's two placements, with the accent check on the selected row and
//     16px-inset dividers between rows.

screenshot('SelectPill secondary collapsed', () => (
    <div className="flex h-[64px] w-[390px] justify-end bg-backgroundPage p-2">
        <SelectPillHarness variant="secondary" menuPosition="below-end" />
    </div>
));

screenshot('SelectPill tertiary collapsed', () => (
    <div className="flex h-[64px] w-[390px] justify-center bg-backgroundPage p-2">
        <SelectPillHarness variant="tertiary" menuPosition="above-center" />
    </div>
));

test('SelectPill opens, reports the pick and shows it on the pill', async ({ mount }) => {
    const c = await mount(
        <div className="flex h-[220px] w-[390px] items-end justify-center bg-backgroundPage p-2">
            <SelectPillHarness variant="tertiary" menuPosition="above-center" />
        </div>
    );
    await c.getByRole('button', { name: /All/ }).click();
    await c.getByText('Ethereum').click();
    await expect(c.getByRole('button', { name: /Ethereum/ })).toBeVisible();
    await expect(c.getByText('Bitcoin')).not.toBeVisible();
});

test('SelectPill closes on an outside click without changing the value', async ({ mount }) => {
    const c = await mount(
        <div className="flex h-[220px] w-[390px] items-end justify-center bg-backgroundPage p-2">
            <SelectPillHarness variant="secondary" menuPosition="below-end" />
        </div>
    );
    await c.getByRole('button', { name: /All/ }).click();
    await expect(c.getByText('Bitcoin')).toBeVisible();
    await c.click({ position: { x: 8, y: 8 } });
    await expect(c.getByText('Bitcoin')).not.toBeVisible();
    await expect(c.getByRole('button', { name: /All/ })).toBeVisible();
});
