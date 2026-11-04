import { expect, screenshot, test } from '../../../../playwright/test';
import { ListTitle } from './ListTitle';
import { TradeNetworkDropdown } from './trade/TradeNetworkDropdown';

// Edge cases the screenshot suite targets:
//   - navigating title shows the trailing dim chevron; static title doesn't.
//   - the right slot (network pill) aligns to the row end without pushing
//     the title off its 48px baseline.

const STAGE = 'w-[390px] bg-backgroundPage';

screenshot('ListTitle with chevron and network pill', () => (
    <div className={STAGE}>
        <ListTitle
            title="Trending"
            onClick={() => {}}
            right={<TradeNetworkDropdown value="All" options={['All']} onChange={() => {}} />}
        />
    </div>
));

screenshot('ListTitle static title without controls', () => (
    <div className={STAGE}>
        <ListTitle title="Commodities" />
    </div>
));

test('ListTitle title click fires the navigation callback', async ({ mount }) => {
    let clicks = 0;
    const c = await mount(
        <div className={STAGE}>
            <ListTitle title="Trending" onClick={() => clicks++} />
        </div>
    );
    await c.getByRole('button', { name: 'Trending' }).click();
    expect(clicks).toBe(1);
});

test('ListTitle without a click handler renders no button', async ({ mount }) => {
    const c = await mount(
        <div className={STAGE}>
            <ListTitle title="Commodities" />
        </div>
    );
    await expect(c.getByRole('button')).toHaveCount(0);
});
