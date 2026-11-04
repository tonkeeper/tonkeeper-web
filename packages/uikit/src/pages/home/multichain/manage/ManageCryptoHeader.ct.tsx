import { expect, screenshot, test } from '../../../../../playwright/test';
import { ManageCryptoHeader } from './ManageCryptoHeader';

// Edge cases the suite targets:
//   - centered title flanked by a single round close button pinned right;
//     the `px-16` keeps the title clear of the absolute close button.
//   - the close button carries an aria-label (the `close` translation), so
//     it's reachable by accessible name even though its only content is an
//     icon.
//   - tapping close fires `onClose`.

// CT's static mount-loader can't resolve wrappers defined in the test file —
// inline the sized frame.
const FRAME = 'w-[400px] bg-backgroundPage';

screenshot('ManageCryptoHeader baseline', () => (
    <div className={FRAME}>
        <ManageCryptoHeader onClose={() => {}} />
    </div>
));

test('ManageCryptoHeader renders the title', async ({ mount }) => {
    const c = await mount(
        <div className="w-[400px] bg-backgroundPage">
            <ManageCryptoHeader onClose={() => {}} />
        </div>
    );
    await expect(c).toContainText('Manage crypto');
});

test('ManageCryptoHeader close button fires onClose', async ({ mount }) => {
    let closed = 0;
    const c = await mount(
        <div className="w-[400px] bg-backgroundPage">
            <ManageCryptoHeader onClose={() => closed++} />
        </div>
    );
    await c.getByRole('button', { name: 'Close' }).click();
    expect(closed).toBe(1);
});
