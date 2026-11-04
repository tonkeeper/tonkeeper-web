import { expect, screenshot, test } from '../../playwright/test';
import { CloseButton } from './CloseButton';

// Edge cases the screenshot suite targets:
//   - the figure matches BackButton's 32px secondary circle, unchanged by the
//     positioning classes a host header passes in.

const STAGE = 'w-[120px] bg-backgroundPage p-4';

screenshot('CloseButton', () => (
    <div className={STAGE}>
        <CloseButton onClick={() => {}} />
    </div>
));

test('CloseButton fires its click handler', async ({ mount }) => {
    let clicks = 0;
    const c = await mount(
        <div className={STAGE}>
            <CloseButton onClick={() => clicks++} />
        </div>
    );
    await c.getByRole('button', { name: 'Close' }).click();
    expect(clicks).toBe(1);
});
