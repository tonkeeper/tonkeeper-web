import { expect, screenshot, test } from '../../../../playwright/test';
import { MultichainChainChips } from './MultichainChainChips';

// Edge cases the screenshot suite targets:
//   - "All" chip (value === undefined) renders the translated label and carries
//     no chain icon; every other chip pairs its 20px chain glyph with a label.
//   - the selected chip uses the content-attention fill, the rest the secondary
//     button fill — the only signal of the current filter.
//   - the strip scrolls horizontally (8 chips, hidden scrollbar) inside a
//     constrained width without wrapping.

const WRAP = 'w-[390px] bg-backgroundPage p-4';

screenshot('MultichainChainChips all selected', () => (
    <div className={WRAP}>
        <MultichainChainChips value={undefined} onChange={() => {}} />
    </div>
));

screenshot('MultichainChainChips chain selected', () => (
    <div className={WRAP}>
        <MultichainChainChips value="ton" onChange={() => {}} />
    </div>
));

screenshot('MultichainChainChips custom chain list', () => (
    <div className={WRAP}>
        <MultichainChainChips value={undefined} onChange={() => {}} chains={['ton', 'eth']} />
    </div>
));

test('selecting a chain forwards its code', async ({ mount }) => {
    let selected: string | undefined = 'unset';
    const c = await mount(
        <div className={WRAP}>
            <MultichainChainChips value={undefined} onChange={v => (selected = v)} />
        </div>
    );
    await c.getByRole('button', { name: 'TON', exact: true }).click();
    expect(selected).toBe('ton');
});

test('re-selecting All clears the filter', async ({ mount }) => {
    let selected: string | undefined = 'ton';
    const c = await mount(
        <div className={WRAP}>
            <MultichainChainChips value="ton" onChange={v => (selected = v)} />
        </div>
    );
    await c.getByRole('button', { name: 'All', exact: true }).click();
    expect(selected).toBeUndefined();
});

test('flow-specific subsets keep the shared chain order', async ({ mount }) => {
    const c = await mount(
        <div className={WRAP}>
            <MultichainChainChips
                value={undefined}
                onChange={() => {}}
                chains={['arb', 'unknown', 'eth', 'ton', 'tron', 'eth']}
            />
        </div>
    );

    expect(await c.getByRole('button').allTextContents()).toEqual([
        'All',
        'TON',
        'Tron',
        'Ethereum',
        'Arbitrum',
        'UNKNOWN'
    ]);
});
