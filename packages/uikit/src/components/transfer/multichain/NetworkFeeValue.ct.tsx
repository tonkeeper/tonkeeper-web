import { expect, screenshot, test } from '../../../../playwright/test';
import { NetworkFeeValue } from './NetworkFeeValue';

const noop = () => {};

// Plain host wrapper mirroring the confirm row's cell-value styling (label1 /
// primary, right-aligned) so the screenshot reflects the real look.
// (Playwright CT can only mount real imported components, not ones defined in
// the test file, so the wrapper must stay a plain <div>.)
const CELL = 'w-[280px] bg-backgroundContent p-4 text-right text-label1 text-textPrimary';

// One screenshot per state — the value has no breakpoint-dependent layout, so
// desktop and mobile would render identically (hence `screenshot`, not
// `screenshotEachMode`).
screenshot('NetworkFeeValue single method', () => (
    <div className={CELL}>
        <NetworkFeeValue value="0.000262 TON" />
    </div>
));

screenshot('NetworkFeeValue with unit', () => (
    <div className={CELL}>
        <NetworkFeeValue value="$0.000262" unit="TON" />
    </div>
));

screenshot('NetworkFeeValue method picker', () => (
    <div className={CELL}>
        <NetworkFeeValue value="$0.000262" unit="TON" onChange={noop} />
    </div>
));

screenshot('NetworkFeeValue unpriced method picker', () => (
    <div className={CELL}>
        <NetworkFeeValue onChange={noop} />
    </div>
));

screenshot('NetworkFeeValue loading', () => (
    <div className={CELL}>
        <NetworkFeeValue loading />
    </div>
));

screenshot('NetworkFeeValue error', () => (
    <div className={CELL}>
        <NetworkFeeValue error onRetry={noop} />
    </div>
));

test('NetworkFeeValue retry fires onRetry', async ({ mount }) => {
    let retried = 0;
    const c = await mount(<NetworkFeeValue error onRetry={() => (retried += 1)} />);
    await c.getByText('Retry').click();
    expect(retried).toBe(1);
});

// The mount locator resolves to the component's single root element, so a
// root-level <button> would fall outside its own descendant queries — the
// behaviour tests mount inside a plain <div> host.
test('NetworkFeeValue renders a plain unit when the method is fixed', async ({ mount }) => {
    const c = await mount(
        <div>
            <NetworkFeeValue value="$0.000262" unit="TON" />
        </div>
    );
    // The unit is plain text in the value, not a styled accent element.
    await expect(c.locator('.text-textAccent')).toHaveCount(0);
    await expect(c.getByRole('button')).toHaveCount(0);
});

test('NetworkFeeValue opens the picker from the accent unit', async ({ mount }) => {
    let opened = 0;
    const c = await mount(
        <div>
            <NetworkFeeValue value="$0.000262" unit="TON" onChange={() => (opened += 1)} />
        </div>
    );
    await expect(c.locator('span.text-textAccent')).toHaveText('TON');
    await c.getByRole('button').click();
    expect(opened).toBe(1);
});
