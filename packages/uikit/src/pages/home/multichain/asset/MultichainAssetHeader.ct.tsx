import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainAssetHeader } from './MultichainAssetHeader';

// Edge cases the screenshot suite targets:
//   - native coin and tokens alike show only the full chain name as the
//     sub-label ("TON", "Tron", "Ethereum") — never the token standard.
//   - back and more buttons stay pinned to the edges while the title block
//     centres independently of title length.

const sampleAsset = (overrides: Partial<MultichainWalletAsset>): MultichainWalletAsset => ({
    assetId: 'ton/mainnet/coin',
    chain: 'ton',
    name: 'TON',
    symbol: 'TON',
    decimals: 9,
    image: '',
    balance: '0',
    verification: 'whitelist',
    isHidden: false,
    ...overrides
});

const FRAME = 'w-[390px] bg-backgroundPage';

screenshot('MultichainAssetHeader native coin shows network label', () => (
    <div className={FRAME}>
        <MultichainAssetHeader asset={sampleAsset({})} />
    </div>
));

screenshot('MultichainAssetHeader TRC20 token shows chain name only', () => (
    <div className={FRAME}>
        <MultichainAssetHeader
            asset={sampleAsset({
                assetId: 'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                chain: 'tron',
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6
            })}
        />
    </div>
));

screenshot('MultichainAssetHeader long token name stays centred', () => (
    <div className={FRAME}>
        <MultichainAssetHeader
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
                chain: 'evm',
                name: 'Shiba Inu',
                symbol: 'SHIB',
                decimals: 18
            })}
        />
    </div>
));

test('MultichainAssetHeader renders name and chain sub-label', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetHeader
                asset={sampleAsset({
                    assetId: 'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                    chain: 'tron',
                    name: 'Tether USD',
                    symbol: 'USDT',
                    decimals: 6
                })}
            />
        </div>
    );
    await expect(c.getByText('Tether USD')).toBeVisible();
    await expect(c.getByText('Tron', { exact: true })).toBeVisible();
    await expect(c.getByText('TRC20')).toHaveCount(0);
});

test('MultichainAssetHeader back button is reachable', async ({ mount }) => {
    const c = await mount(
        <div className={FRAME}>
            <MultichainAssetHeader asset={sampleAsset({})} />
        </div>
    );
    await expect(c.getByRole('button', { name: 'Back' })).toBeVisible();
});
