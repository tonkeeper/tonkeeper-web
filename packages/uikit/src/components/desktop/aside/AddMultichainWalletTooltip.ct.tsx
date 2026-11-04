import { expect, screenshot, test } from '../../../../playwright/test';
import { AddMultichainWalletTooltip } from './AddMultichainWalletTooltip';
import { AddWalletRowStub, LegacyOnlyHarness } from './AddMultichainWalletTooltipHarness';

// Edge cases the suite targets:
//   - the bubble shows above the add-wallet control only when no
//     multichain account exists; the default fixture (multichain active)
//     never shows it;
//   - the show budget: three lifetime shows, so a pre-spent budget hides it;
//   - a click on the bubble opens the add-wallet flow and closes it;
//   - a click on the control it points at closes it too.

// CT's static mount-loader can't resolve wrappers defined in the test file,
// so the sized container is a plain class string. The top padding leaves
// room for the bubble, which renders above the row.
const FRAME = 'w-[240px] bg-backgroundContent px-2 pb-2 pt-20';

screenshot('AddMultichainWalletTooltip visible', () => (
    <LegacyOnlyHarness>
        <div className={FRAME}>
            <AddMultichainWalletTooltip onOpenAddWallet={() => {}}>
                <AddWalletRowStub />
            </AddMultichainWalletTooltip>
        </div>
    </LegacyOnlyHarness>
));

test('stays hidden when a multichain account exists', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <AddMultichainWalletTooltip onOpenAddWallet={() => {}}>
                <AddWalletRowStub />
            </AddMultichainWalletTooltip>
        </div>
    );
    await expect(c.getByRole('button', { name: 'Add Wallet', exact: true })).toBeVisible();
    await expect(c).not.toContainText('Add a multichain wallet');
});

test('stays hidden once the show budget is spent', async ({ mount }) => {
    const c = await mount(
        <LegacyOnlyHarness shownCount={3}>
            <div className={FRAME}>
                <AddMultichainWalletTooltip onOpenAddWallet={() => {}}>
                    <AddWalletRowStub />
                </AddMultichainWalletTooltip>
            </div>
        </LegacyOnlyHarness>
    );
    await expect(c.getByRole('button', { name: 'Add Wallet', exact: true })).toBeVisible();
    await expect(c).not.toContainText('Add a multichain wallet');
});

test('clicking the bubble opens add wallet and closes it', async ({ mount }) => {
    let opened = 0;
    const c = await mount(
        <LegacyOnlyHarness>
            <div className={FRAME}>
                <AddMultichainWalletTooltip onOpenAddWallet={() => (opened += 1)}>
                    <AddWalletRowStub />
                </AddMultichainWalletTooltip>
            </div>
        </LegacyOnlyHarness>
    );
    const bubble = c.getByRole('button', { name: /multichain wallet/ });
    await expect(bubble).toBeVisible();
    await bubble.click();
    await expect.poll(() => opened).toBe(1);
    await expect(bubble).toBeHidden();
});

test('clicking the add-wallet control closes the bubble', async ({ mount }) => {
    const c = await mount(
        <LegacyOnlyHarness>
            <div className={FRAME}>
                <AddMultichainWalletTooltip onOpenAddWallet={() => {}}>
                    <AddWalletRowStub />
                </AddMultichainWalletTooltip>
            </div>
        </LegacyOnlyHarness>
    );
    await expect(c).toContainText('Add a multichain wallet');
    await c.getByRole('button', { name: 'Add Wallet', exact: true }).click();
    await expect(c).not.toContainText('Add a multichain wallet');
});
