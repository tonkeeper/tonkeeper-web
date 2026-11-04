import { expect, screenshot, test } from '../../../../../playwright/test';
import { TradeNetworkDropdown } from './TradeNetworkDropdown';
import { TradeNetworkDropdownInteractiveStory } from './TradeNetworkDropdownStory';

// Edge cases the screenshot suite targets:
//   - collapsed pill shows globe + value + switch glyphs on the secondary
//     button surface.
//   - open menu aligns right under the pill, marks the active option with
//     the accent check, and insets dividers by 16px.

const NETWORKS = ['All', 'Bitcoin', 'Ethereum', 'Solana', 'Base', 'Arbitrum', 'Polygon'];

screenshot('TradeNetworkDropdown collapsed', () => (
    <div className="flex h-[64px] w-[390px] justify-end bg-backgroundPage p-2">
        <div>
            <TradeNetworkDropdown value="All" options={NETWORKS} onChange={() => {}} />
        </div>
    </div>
));

test('TradeNetworkDropdown opens, selects an option and closes', async ({ mount }) => {
    const c = await mount(<TradeNetworkDropdownInteractiveStory />);
    await c.getByRole('button', { name: /All/ }).click();
    await expect(c.getByText('Ethereum')).toBeVisible();
    await c.getByText('Ethereum').click();
    await expect(c.getByText('Bitcoin')).not.toBeVisible();
    await expect(c.getByRole('button', { name: /Ethereum/ })).toBeVisible();
});
