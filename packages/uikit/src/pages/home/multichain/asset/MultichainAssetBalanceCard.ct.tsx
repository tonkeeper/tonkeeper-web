import { expect, screenshot, test } from '../../../../../playwright/test';
import { BalanceCardAsset, BalanceCardHarness } from './MultichainAssetBalanceCardHarness';

// Edge cases the screenshot suite targets:
//   - native coin → no chain badge overlay on the icon.
//   - non-native (TRC20) → small chain badge sits bottom-right of the icon.
//   - asset with price → fiat value sub-line renders under the token amount.
//   - asset without price → fiat sub-line is omitted, layout stays single-line.

const sampleAsset = (overrides: Partial<BalanceCardAsset>): BalanceCardAsset => ({
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

screenshot('MultichainAssetBalanceCard TON native with fiat value', () => (
    <BalanceCardHarness humanStr="12.5" asset={sampleAsset({ priceStr: '5.43' })} />
));

screenshot('MultichainAssetBalanceCard TRC20 USDT shows chain badge', () => (
    <BalanceCardHarness
        humanStr="250"
        asset={sampleAsset({
            assetId: 'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
            chain: 'tron',
            name: 'Tether USD',
            symbol: 'USDT',
            decimals: 6,
            priceStr: '0.999'
        })}
    />
));

screenshot('MultichainAssetBalanceCard no price omits fiat sub-line', () => (
    <BalanceCardHarness
        humanStr="100"
        asset={sampleAsset({
            assetId: 'eth/mainnet/erc20/0x6b175474e89094c44da98b954eedeac495271d0f',
            chain: 'evm',
            name: 'Dai',
            symbol: 'DAI',
            decimals: 18
        })}
    />
));

test('MultichainAssetBalanceCard shows the token amount and symbol', async ({ mount }) => {
    const c = await mount(
        <BalanceCardHarness humanStr="12.5" asset={sampleAsset({ priceStr: '5.43' })} />
    );
    await expect(c.getByText('Your balance')).toBeVisible();
    await expect(c.getByText(/TON/)).toBeVisible();
});
