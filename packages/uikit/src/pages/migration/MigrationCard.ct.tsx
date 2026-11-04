import { expect, screenshotEachMode, test } from '../../../playwright/test';
import { Emphasis, MigrationCard, WithEmphasis } from './MigrationCard';

// Edge cases the suite targets:
//   - the card is a centred 520px panel on desktop and the whole viewport on a
//     phone, with the actions pinned to the bottom — hence both modes.
//   - `WithEmphasis` finds the host again inside the translated sentence, so a
//     translation that drops the host must still render the plain text.

screenshotEachMode('MigrationCard full', () => (
    <MigrationCard
        title="Your wallets are on wallet.tonkeeper.com"
        subtitle={
            <>
                From <Emphasis>wallet.tonkeeper.com</Emphasis>
            </>
        }
        description="You'll review and approve them there, in a new window."
        actions={
            <button type="button" className="h-14 rounded-2xl bg-buttonPrimaryBackground">
                Continue
            </button>
        }
    >
        <div className="p-4 text-body1 text-textPrimary">Body</div>
    </MigrationCard>
));

screenshotEachMode('MigrationCard title only', () => <MigrationCard title="No wallets here" />);

test('WithEmphasis highlights every occurrence of the value', async ({ mount }) => {
    const c = await mount(
        <p>
            <WithEmphasis text="a.com, then a.com again" value="a.com" />
        </p>
    );
    await expect(c).toHaveText('a.com, then a.com again');
    await expect(c.locator('span')).toHaveCount(2);
});

test('WithEmphasis renders plain text when the value is missing', async ({ mount }) => {
    const c = await mount(
        <p>
            <WithEmphasis text="From the old site" value="a.com" />
        </p>
    );
    await expect(c).toHaveText('From the old site');
    await expect(c.locator('span')).toHaveCount(0);
});
