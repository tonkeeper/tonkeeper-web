import { expect, screenshot, test } from '../../../../playwright/test';
import { HomeMultichainOnboardingCard } from './HomeMultichainOnboardingCard';

// Edge cases the suite targets:
//   - the card has no props — content is fully driven by translations, so
//     the screenshot just confirms the static layout (title/subtitle/CTA on
//     the left, the gradient avatar circle on the right).
//   - title/subtitle both carry `truncate`; on a narrow container the text
//     must clip rather than push the avatar out of the card.
//   - the "Start Now" CTA is a real button; clicking it is a no-op today but
//     must not throw.

// CT's static mount-loader can't resolve component wrappers defined in the
// test file, so inline the sized container.
const FRAME = 'w-[400px] bg-backgroundPage';
const NARROW = 'w-[260px] bg-backgroundPage';

screenshot('HomeMultichainOnboardingCard baseline', () => (
    <div className={FRAME}>
        <HomeMultichainOnboardingCard />
    </div>
));

screenshot('HomeMultichainOnboardingCard narrow truncates copy', () => (
    <div className={NARROW}>
        <HomeMultichainOnboardingCard />
    </div>
));

test('HomeMultichainOnboardingCard renders title, subtitle and CTA', async ({ mount }) => {
    const c = await mount(
        <div className="w-[400px] bg-backgroundPage">
            <HomeMultichainOnboardingCard />
        </div>
    );
    await expect(c).toContainText('Get started with your wallet');
    await expect(c).toContainText('Learn step by step');
    await expect(c.getByRole('button', { name: 'Start Now' })).toBeVisible();
});

test('HomeMultichainOnboardingCard CTA is clickable without throwing', async ({ mount }) => {
    const c = await mount(
        <div className="w-[400px] bg-backgroundPage">
            <HomeMultichainOnboardingCard />
        </div>
    );
    await c.getByRole('button', { name: 'Start Now' }).click();
    await expect(c.getByRole('button', { name: 'Start Now' })).toBeVisible();
});
