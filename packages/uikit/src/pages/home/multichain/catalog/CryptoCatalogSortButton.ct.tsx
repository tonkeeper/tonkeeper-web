import { expect, screenshot, test } from '../../../../../playwright/test';
import { CryptoCatalogSortButton } from './CryptoCatalogSortButton';

// Edge cases the screenshot suite targets:
//   - the trigger label reflects the active sort option (`market_cap` →
//     "Market Cap"); the arrows glyph trails it.
//   - the menu lists the four native-picker options (Market Cap, Volume,
//     Top Gainers, Top Losers); the active one shows the accent check.
// The component is absolutely positioned (`bottom-6 left-1/2`), so the host
// div is `relative` with explicit height to give the screenshot bounds and
// the upward menu headroom.

const STAGE = 'relative w-[260px] h-[200px] rounded-medium bg-backgroundContent';

screenshot('CryptoCatalogSortButton collapsed market cap', () => (
    <div className={STAGE}>
        <CryptoCatalogSortButton value="market_cap" onChange={() => {}} />
    </div>
));

screenshot('CryptoCatalogSortButton collapsed volume', () => (
    <div className={STAGE}>
        <CryptoCatalogSortButton value="volume" onChange={() => {}} />
    </div>
));

screenshot('CryptoCatalogSortButton collapsed top gainers', () => (
    <div className={STAGE}>
        <CryptoCatalogSortButton value="top_gainers" onChange={() => {}} />
    </div>
));

screenshot('CryptoCatalogSortButton collapsed top losers', () => (
    <div className={STAGE}>
        <CryptoCatalogSortButton value="top_losers" onChange={() => {}} />
    </div>
));

test('CryptoCatalogSortButton opens the menu and selects an option', async ({ mount }) => {
    let selected: string | undefined;
    const c = await mount(
        <div className={STAGE}>
            <CryptoCatalogSortButton value="market_cap" onChange={v => (selected = v)} />
        </div>
    );
    // First button is the trigger; clicking it reveals the option list.
    await c.getByRole('button').first().click();
    await expect(c.getByText('Market Cap', { exact: true })).toHaveCount(2);
    await expect(c.getByText('Volume', { exact: true })).toBeVisible();
    await expect(c.getByText('Top Gainers', { exact: true })).toBeVisible();
    await expect(c.getByText('Top Losers', { exact: true })).toBeVisible();
    await c.getByText('Top Losers', { exact: true }).click();
    expect(selected).toBe('top_losers');
});
