import { expect, screenshot, test } from '../../playwright/test';
import { BackButton } from './BackButton';

// Edge cases the screenshot suite targets:
//   - the figure is a 32px secondary circle, unchanged by the positioning
//     classes a host header passes in.

const STAGE = 'w-[120px] bg-backgroundPage p-4';

screenshot('BackButton', () => (
    <div className={STAGE}>
        <BackButton onClick={() => {}} />
    </div>
));

test('BackButton fires its click handler', async ({ mount }) => {
    let clicks = 0;
    const c = await mount(
        <div className={STAGE}>
            <BackButton onClick={() => clicks++} />
        </div>
    );
    await c.getByRole('button', { name: 'Back' }).click();
    expect(clicks).toBe(1);
});
