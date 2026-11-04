import { expect, screenshot, test } from '../../../../../playwright/test';
import { ManageRowAsset, ManageRowHarness } from './ManageCryptoRowHarness';

// Edge cases the screenshot suite targets:
//   - subtitle composition: `{balance} {symbol}` with no price, vs
//     `{balance} {symbol} · {fiat}` with a price — the dot separator
//     only appears in the with-fiat shape.
//   - long symbol next to a chain chip → `truncate` must engage; the
//     eye icon column must stay visible on the right.
//   - very large balance → no overflow / wrap.
//   - eye state: visible uses `text-textAccent`, hidden uses
//     `text-textTertiary` — drives the only visual signal of the toggle.

const sampleAsset = (overrides: Partial<ManageRowAsset>): ManageRowAsset => ({
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

const CARD = 'w-[360px] overflow-hidden rounded-medium bg-backgroundContent';
const NARROW = 'w-[280px] overflow-hidden rounded-medium bg-backgroundContent';

const TON_VISIBLE = sampleAsset({
    balance: '4530000000',
    priceStr: '5.43'
});

screenshot('ManageCryptoRow TON visible baseline', () => (
    <div className={CARD}>
        <ManageRowHarness asset={TON_VISIBLE} visible onToggle={() => {}} />
    </div>
));

screenshot('ManageCryptoRow hidden eye with chain chip', () => (
    <div className={CARD}>
        <ManageRowHarness
            asset={sampleAsset({
                assetId: 'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
                chain: 'tron',
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
                balance: '25790000',
                priceStr: '0.999'
            })}
            visible={false}
            onToggle={() => {}}
        />
    </div>
));

screenshot('ManageCryptoRow no price drops the fiat segment of the subtitle', () => (
    <div className={CARD}>
        <ManageRowHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0x6b175474e89094c44da98b954eedeac495271d0f',
                chain: 'evm',
                name: 'Dai',
                symbol: 'DAI',
                decimals: 18,
                balance: '1000000000000000000'
            })}
            visible
            onToggle={() => {}}
        />
    </div>
));

screenshot('ManageCryptoRow long symbol truncates beside chip', () => (
    <div className={NARROW}>
        <ManageRowHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xdeadbeef',
                chain: 'evm',
                name: 'Super Long',
                symbol: 'SUPERLONGTOKEN',
                decimals: 18,
                balance: '12340000000000000000',
                priceStr: '0.42'
            })}
            visible
            onToggle={() => {}}
        />
    </div>
));

screenshot('ManageCryptoRow very large balance stays single line', () => (
    <div className={CARD}>
        <ManageRowHarness
            asset={sampleAsset({
                assetId: 'eth/mainnet/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
                chain: 'evm',
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                balance: '1234567890000', // 1.234M USDC
                priceStr: '1.00'
            })}
            visible
            onToggle={() => {}}
        />
    </div>
));

test('ManageCryptoRow tapping the row fires onToggle', async ({ mount }) => {
    let toggled = 0;
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <ManageRowHarness asset={TON_VISIBLE} visible onToggle={() => toggled++} />
        </div>
    );
    await c.getByRole('button').click();
    expect(toggled).toBe(1);
});

test('ManageCryptoRow visible=true uses the textAccent eye colour', async ({ mount }) => {
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <ManageRowHarness asset={TON_VISIBLE} visible onToggle={() => {}} />
        </div>
    );
    // EyeVisible uses text-textAccent; EyeHidden uses text-textTertiary.
    // Locate by class as a behavioural anchor — the SVGs carry no testid.
    await expect(c.locator('svg.text-textAccent')).toBeVisible();
});

test('ManageCryptoRow visible=false uses the textTertiary eye colour', async ({ mount }) => {
    const c = await mount(
        <div className="w-[360px] overflow-hidden rounded-medium bg-backgroundContent">
            <ManageRowHarness asset={TON_VISIBLE} visible={false} onToggle={() => {}} />
        </div>
    );
    await expect(c.locator('svg.text-textTertiary')).toBeVisible();
});
