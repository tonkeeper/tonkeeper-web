import { expect, screenshot, test } from '../../../../playwright/test';
import { FinishSetupHarness } from './FinishSetupHarness';
import { FinishSetupSection } from './FinishSetupSection';

// Edge cases the suite targets:
//   - the section renders only when the active multichain account has
//     legacy TON wallets with assets to migrate; the default fixture
//     (multichain only) renders nothing, and neither do drained wallets;
//   - the migration row's caption counts the funded wallets only, with the
//     singular form for exactly one;
//   - Skip hides the section and persists, so a remount for the same
//     account stays empty (seeded via the harness `skipped` flag).

// CT's static mount-loader can't resolve wrappers defined in the test file,
// so the sized containers are plain class strings.
const FRAME = 'w-[390px] bg-backgroundPage px-4';

screenshot('FinishSetupSection two wallets', () => (
    <FinishSetupHarness>
        <div className={FRAME}>
            <FinishSetupSection />
        </div>
    </FinishSetupHarness>
));

test('counts the legacy wallets left, singular for one', async ({ mount }) => {
    const c = await mount(
        <FinishSetupHarness legacyCount={1}>
            <div className={FRAME}>
                <FinishSetupSection />
            </div>
        </FinishSetupHarness>
    );
    await expect(c).toContainText('Finish setting up');
    await expect(c).toContainText('Migrate assets from your TON wallets');
    await expect(c).toContainText('1 wallet left');
});

test('renders nothing without legacy wallets', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <FinishSetupSection />
        </div>
    );
    await expect(c).not.toContainText('Finish setting up');
});

test('counts only the wallets that still hold assets', async ({ mount }) => {
    const c = await mount(
        <FinishSetupHarness legacyCount={3} fundedCount={1}>
            <div className={FRAME}>
                <FinishSetupSection />
            </div>
        </FinishSetupHarness>
    );
    await expect(c).toContainText('1 wallet left');
});

test('renders nothing once every legacy wallet is drained', async ({ mount }) => {
    const c = await mount(
        <FinishSetupHarness fundedCount={0}>
            <div className={FRAME}>
                <FinishSetupSection />
            </div>
        </FinishSetupHarness>
    );
    await expect(c).not.toContainText('Finish setting up');
});

test('renders nothing once skipped for the account', async ({ mount }) => {
    const c = await mount(
        <FinishSetupHarness skipped>
            <div className={FRAME}>
                <FinishSetupSection />
            </div>
        </FinishSetupHarness>
    );
    await expect(c).not.toContainText('Finish setting up');
});

test('Skip hides the section', async ({ mount }) => {
    const c = await mount(
        <FinishSetupHarness>
            <div className={FRAME}>
                <FinishSetupSection />
            </div>
        </FinishSetupHarness>
    );
    await expect(c).toContainText('2 wallets left');
    await c.getByRole('button', { name: 'Skip' }).click();
    await expect(c).not.toContainText('Finish setting up');
});
