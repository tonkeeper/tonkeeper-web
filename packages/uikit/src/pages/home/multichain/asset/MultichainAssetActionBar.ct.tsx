import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { MultichainAssetActionBar } from './MultichainAssetActionBar';

const ASSET: MultichainWalletAsset = {
    assetId: 'eth/mainnet/coin',
    chain: 'evm',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    image: '',
    balance: '0',
    verification: 'whitelist',
    isHidden: false
};

// Edge cases the screenshot suite targets:
//   - hasBalance true → Buy + Sell.
//   - hasBalance false → Sell button is absent and Buy stretches to fill
//     the freed space.
//   - compact (desktop, sticky) vs non-compact (mobile, fixed) only
//     differ in positioning; the visual chrome is identical, so a single
//     screenshot per balance state is enough.

const FRAME = 'relative w-[390px] bg-backgroundPage';

screenshot('MultichainAssetActionBar with balance shows buy and sell', () => (
    <div className={FRAME}>
        <MultichainAssetActionBar asset={ASSET} hasBalance compact />
    </div>
));

screenshot('MultichainAssetActionBar without balance hides sell', () => (
    <div className={FRAME}>
        <MultichainAssetActionBar asset={ASSET} hasBalance={false} compact />
    </div>
));

test('MultichainAssetActionBar renders sell only when there is a balance', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetActionBar asset={ASSET} hasBalance compact />
        </div>
    );
    await expect(c.getByText('Sell')).toBeVisible();
    await expect(c.getByText('Buy')).toBeVisible();
});

test('MultichainAssetActionBar omits sell button without a balance', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetActionBar asset={ASSET} hasBalance={false} compact />
        </div>
    );
    await expect(c.getByText('Buy')).toBeVisible();
    await expect(c.getByText('Sell')).toHaveCount(0);
});

test('MultichainAssetActionBar opens swap in the requested direction', async ({ mount }) => {
    let direction: 'buy' | 'sell' | undefined;
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetActionBar
                asset={ASSET}
                hasBalance
                compact
                onSwap={next => {
                    direction = next;
                }}
            />
        </div>
    );

    await c.getByText('Buy').click();
    expect(direction).toBe('buy');
    await c.getByText('Sell').click();
    expect(direction).toBe('sell');
});
