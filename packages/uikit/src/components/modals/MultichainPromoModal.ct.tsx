import { expect, screenshotEachMode, test } from '../../../playwright/test';
import { MultichainPromo, MultichainPromoModal } from './MultichainPromoModal';
import { LegacyOnlyPromoHarness } from './MultichainPromoHarness';

// Edge cases the suite targets:
//   - the open modal on desktop (centered card) and mobile (bottom sheet);
//   - it shows by itself for an install holding only legacy wallets;
//   - it stays hidden when a multichain account exists (the default
//     fixture) or once it has been shown;
//   - "Later" and "Try multichain wallet" both close it.

screenshotEachMode(
    'MultichainPromoModal',
    () => <MultichainPromoModal isOpen onClose={() => {}} onTry={() => {}} />,
    ['desktop', 'mobile'],
    {
        target: 'dialog',
        interact: async (_, page) => {
            await page.waitForFunction(() =>
                Array.from(document.images).every(img => img.complete && img.naturalWidth > 0)
            );
        }
    }
);

test('shows for an install with only legacy wallets', async ({ mount, page }) => {
    await mount(
        <LegacyOnlyPromoHarness>
            <MultichainPromo />
        </LegacyOnlyPromoHarness>
    );
    await expect(page.getByRole('dialog')).toContainText('Multichain wallets are here');
});

test('stays hidden when a multichain account exists', async ({ mount, page }) => {
    await mount(<MultichainPromo />);
    await page.waitForTimeout(300);
    await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('stays hidden once it has been shown', async ({ mount, page }) => {
    await mount(
        <LegacyOnlyPromoHarness promoShown>
            <MultichainPromo />
        </LegacyOnlyPromoHarness>
    );
    await page.waitForTimeout(300);
    await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('"Later" closes the promo', async ({ mount, page }) => {
    await mount(
        <LegacyOnlyPromoHarness>
            <MultichainPromo />
        </LegacyOnlyPromoHarness>
    );
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Later' }).click();
    await expect(dialog).toHaveCount(0);
});

test('"Try multichain wallet" calls onTry', async ({ mount, page }) => {
    let tried = 0;
    await mount(<MultichainPromoModal isOpen onClose={() => {}} onTry={() => (tried += 1)} />);
    await page.getByRole('button', { name: 'Try multichain wallet' }).click();
    await expect.poll(() => tried).toBe(1);
});

test('"Try multichain wallet" closes the promo', async ({ mount, page }) => {
    await mount(
        <LegacyOnlyPromoHarness>
            <MultichainPromo />
        </LegacyOnlyPromoHarness>
    );
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Try multichain wallet' }).click();
    await expect(dialog).toHaveCount(0);
});
