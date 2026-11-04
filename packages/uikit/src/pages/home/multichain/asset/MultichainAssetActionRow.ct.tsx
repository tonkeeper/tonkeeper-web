import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { MultichainAssetActionRow } from './MultichainAssetActionRow';

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
//   - balance + onramp + offramp → Send, Receive, Cash buy, Cash sell share
//     the row equally (the Figma reference state).
//   - no balance, no ramps → a single full-width Receive button.

const FRAME = 'relative w-[390px] bg-backgroundPage';

screenshot('MultichainAssetActionRow with balance and both ramps', () => (
    <div className={FRAME}>
        <MultichainAssetActionRow
            asset={ASSET}
            hasBalance
            canCashBuy
            canCashSell
            className="pt-2"
        />
    </div>
));

screenshot('MultichainAssetActionRow receive only', () => (
    <div className={FRAME}>
        <MultichainAssetActionRow
            asset={ASSET}
            hasBalance={false}
            canCashBuy={false}
            canCashSell={false}
            className="pt-4"
        />
    </div>
));

test('MultichainAssetActionRow omits Send without a balance', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetActionRow asset={ASSET} hasBalance={false} canCashBuy canCashSell />
        </div>
    );
    await expect(c.getByText('Receive')).toBeVisible();
    await expect(c.getByText('Cash buy')).toBeVisible();
    await expect(c.getByText('Send')).toHaveCount(0);
    // Nothing to sell either.
    await expect(c.getByText('Cash sell')).toHaveCount(0);
});

test('MultichainAssetActionRow shows Cash buy only for onramp assets', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetActionRow
                asset={ASSET}
                hasBalance
                canCashBuy={false}
                canCashSell={false}
            />
        </div>
    );
    await expect(c.getByText('Send')).toBeVisible();
    await expect(c.getByText('Receive')).toBeVisible();
    await expect(c.getByText('Cash buy')).toHaveCount(0);
    await expect(c.getByText('Cash sell')).toHaveCount(0);
});

test('MultichainAssetActionRow shows Cash sell for offramp assets with a balance', async ({
    mount
}) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetActionRow asset={ASSET} hasBalance canCashBuy={false} canCashSell />
        </div>
    );
    await expect(c.getByText('Cash sell')).toBeVisible();
});
