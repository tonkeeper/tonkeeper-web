import { expect, test } from '../../../../../playwright/test';
import { MultichainAssetMenu } from './MultichainAssetMenu';

// Behaviour targets (explorer templates come from the harness boot config,
// the TON account from the seeded multichain account):
//   - token asset offers the explorer link with the config's brand name and
//     the token template filled in; the TON coin links the wallet's account
//     page; other native coins and unknown chains hide the row.
//   - hide toggle fires the visibility callback with the new state.

const STAGE = 'relative h-[220px] w-[320px] bg-backgroundPage';

test('MultichainAssetMenu links the token to its chain explorer', async ({ mount }) => {
    const c = await mount(
        <div className={STAGE}>
            <MultichainAssetMenu assetId="eth/mainnet/erc20/0xdeadbeef" />
        </div>
    );
    await c.getByRole('button').click();
    const link = c.getByRole('link', { name: /Blockscout/ });
    await expect(link).toHaveAttribute('href', 'https://eth.blockscout.com/token/0xdeadbeef');
});

test('MultichainAssetMenu links the TON coin to the wallet account page', async ({ mount }) => {
    const c = await mount(
        <div className={STAGE}>
            <MultichainAssetMenu assetId="ton/mainnet/coin" />
        </div>
    );
    await c.getByRole('button').click();
    const link = c.getByRole('link', { name: /Tonviewer/ });
    await expect(link).toHaveAttribute('href', /^https:\/\/tonviewer\.com\/UQ/);
});

test('MultichainAssetMenu hides the explorer row for other native coins', async ({ mount }) => {
    const c = await mount(
        <div className={STAGE}>
            <MultichainAssetMenu assetId="eth/mainnet/coin" />
        </div>
    );
    await c.getByRole('button').click();
    await expect(c.getByText('Hide from Wallet')).toBeVisible();
    await expect(c.getByText(/View on/)).not.toBeVisible();
});

test('MultichainAssetMenu hides the explorer row for unknown chains', async ({ mount }) => {
    const c = await mount(
        <div className={STAGE}>
            <MultichainAssetMenu assetId="doge/mainnet/coin" />
        </div>
    );
    await c.getByRole('button').click();
    await expect(c.getByText('Hide from Wallet')).toBeVisible();
    await expect(c.getByText(/View on/)).not.toBeVisible();
});

test('MultichainAssetMenu toggling visibility fires the callback', async ({ mount }) => {
    let hidden: boolean | undefined;
    const c = await mount(
        <div className={STAGE}>
            <MultichainAssetMenu
                assetId="eth/mainnet/erc20/0xdeadbeef"
                onVisibilityChange={h => (hidden = h)}
            />
        </div>
    );
    await c.getByRole('button').click();
    await c.getByText('Hide from Wallet').click();
    await expect.poll(() => hidden).toBe(true);
});
