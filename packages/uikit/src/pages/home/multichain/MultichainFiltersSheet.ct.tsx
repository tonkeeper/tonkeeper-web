import { expect, screenshot, test } from '../../../../playwright/test';
import { FiltersButton } from './MultichainFiltersSheet';
import { MultichainFiltersSheetHarness } from './MultichainFiltersSheetHarness';

// Edge cases the suite targets:
//   - the entry figure matches BackButton's 32px secondary circle;
//   - a toggle row applies immediately (no confirm step) and reflects the
//     new state on the switch.

const STAGE = 'w-[120px] bg-backgroundPage p-4';

screenshot('FiltersButton', () => (
    <div className={STAGE}>
        <FiltersButton onClick={() => {}} />
    </div>
));

test('MultichainFiltersSheet applies a toggle immediately', async ({ mount, page }) => {
    const changes: boolean[] = [];
    await mount(<MultichainFiltersSheetHarness onChange={next => changes.push(next)} />);

    await expect(page.getByText('Hide tiny transfers')).toBeVisible();
    await page.getByRole('switch').click();
    expect(changes).toEqual([true]);
    await expect(page.getByRole('switch')).toBeChecked();
});
