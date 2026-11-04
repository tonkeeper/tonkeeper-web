import { expect, screenshot, test } from '../../../../playwright/test';
import { MultichainMobileTabBar } from './MultichainMobileTabBar';

// The bar positions itself `fixed` at the viewport bottom; the stage only
// provides height so the screenshot captures it. The mount router defaults
// to `/`, which makes Wallet the active tab.

screenshot('MultichainMobileTabBar wallet active', () => (
    <div className="relative h-[96px] w-[390px] bg-backgroundPage">
        <MultichainMobileTabBar />
    </div>
));

// The mount sdk reports `targetEnv: 'web'`, so the dApp-catalog tab is
// labeled "Discover" — only the capacitor shells keep "Browser".
test('MultichainMobileTabBar navigates from Wallet to Discover', async ({ mount }) => {
    const c = await mount(
        <div className="relative h-[96px] w-[390px] bg-backgroundPage">
            <MultichainMobileTabBar />
        </div>
    );
    const wallet = c.getByRole('button', { name: 'Wallet' });
    const browser = c.getByRole('button', { name: 'Discover' });

    await expect(wallet).toHaveAttribute('aria-current', 'page');
    await expect(browser).toBeEnabled();
    await browser.click();
    await expect(browser).toHaveAttribute('aria-current', 'page');
    await expect(wallet).not.toHaveAttribute('aria-current', 'page');
});
