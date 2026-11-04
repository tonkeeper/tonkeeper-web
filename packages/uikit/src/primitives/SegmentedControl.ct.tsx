import { expect, screenshot, test } from '../../playwright/test';
import { SegmentedControl } from './SegmentedControl';
import { SegmentedControlInteractiveStory } from './SegmentedControlStory';

// Edge cases the screenshot suite targets:
//   - the active segment lifts on the tertiary surface, inactive segments
//     stay transparent on the dimmed track.
//   - two- and three-segment variants both split the track evenly.

const STAGE = 'w-[342px] rounded-medium bg-backgroundContent p-2';

screenshot('SegmentedControl two segments first active', () => (
    <div className={STAGE}>
        <SegmentedControl
            options={[
                { value: 'market_cap', label: 'Market Cap' },
                { value: 'volume', label: 'Volume' }
            ]}
            value="market_cap"
            onChange={() => {}}
        />
    </div>
));

screenshot('SegmentedControl two segments second active', () => (
    <div className={STAGE}>
        <SegmentedControl
            options={[
                { value: 'gainers', label: 'Top Gainers' },
                { value: 'losers', label: 'Top Losers' }
            ]}
            value="losers"
            onChange={() => {}}
        />
    </div>
));

test('SegmentedControl switches the active segment on click', async ({ mount }) => {
    const c = await mount(<SegmentedControlInteractiveStory />);
    await expect(c.getByRole('tab', { name: 'Stocks' })).toHaveAttribute('aria-selected', 'true');
    await c.getByRole('tab', { name: 'ETFs' }).click();
    await expect(c.getByRole('tab', { name: 'ETFs' })).toHaveAttribute('aria-selected', 'true');
    await expect(c.getByRole('tab', { name: 'Stocks' })).toHaveAttribute('aria-selected', 'false');
});
