import BigNumber from 'bignumber.js';
import type { Locator } from 'playwright-core';
import type { CrossSwapAsset } from '@tonkeeper/core/dist/swapsApi';
import type { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';

import { expect, screenshot, screenshotEachMode, test } from '../../../../../playwright/test';
import {
    AssetPicker,
    DetailRow,
    MultichainSwapAmountCard,
    SlippageSelect,
    ValueDifferenceRow
} from './MultichainSwapFlow';
import { MultichainSwapAmountCardHarness } from './MultichainSwapAmountCardHarness';
import { AssetPickerSearchHarness } from './AssetPickerSearchHarness';

// Fixtures deliberately carry no image URLs so screenshots never depend on
// the network: native coins render their local chain icon, tokens render the
// placeholder glyph inside the chain-badge overlay.

const ton: CrossSwapAsset = {
    assetId: 'ton/mainnet/coin',
    chainId: 'ton/mainnet',
    chainFamily: 'TON',
    symbol: 'TON',
    name: 'Toncoin',
    decimals: 9,
    supportedAggregators: ['omniston']
};

const eth: CrossSwapAsset = {
    assetId: 'eth/mainnet/coin',
    chainId: 'eth/mainnet',
    chainFamily: 'EVM',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    supportedAggregators: ['swapkit']
};

const usdtEth: CrossSwapAsset = {
    assetId: 'eth/mainnet/erc20/0xdac17f958d2ee523a2206206994597c13d831ec7',
    chainId: 'eth/mainnet',
    chainFamily: 'EVM',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    supportedAggregators: ['swapkit']
};

const usdtTron: CrossSwapAsset = {
    assetId: 'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    chainId: 'tron/mainnet',
    chainFamily: 'TRON',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    supportedAggregators: ['swapkit']
};

const restrictedStock: CrossSwapAsset = {
    assetId: 'eth/mainnet/erc20/0x0000000000000000000000000000000000000abc',
    chainId: 'eth/mainnet',
    chainFamily: 'EVM',
    symbol: 'bTSLA',
    name: 'Backed Tesla',
    decimals: 18,
    supportedAggregators: ['swapkit'],
    allowedCounterparts: [usdtEth.assetId]
};

const PICKER_ASSETS = [ton, eth, usdtEth, usdtTron];

const walletAssets: MultichainWalletAsset[] = [
    {
        assetId: 'ton/mainnet/coin',
        chain: 'ton',
        name: 'Toncoin',
        symbol: 'TON',
        decimals: 9,
        image: '',
        balance: '42750000000',
        verification: 'whitelist',
        isHidden: false,
        price: new BigNumber(1.6)
    },
    {
        assetId: 'eth/mainnet/coin',
        chain: 'evm',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        image: '',
        balance: '560000000000000000',
        verification: 'whitelist',
        isHidden: false,
        price: new BigNumber(1815)
    },
    {
        assetId: usdtEth.assetId,
        chain: 'evm',
        name: 'Tether USD',
        symbol: 'USDT',
        decimals: 6,
        image: '',
        balance: '0',
        verification: 'whitelist',
        isHidden: false,
        price: new BigNumber(1)
    }
];

// ─── Amount card ──────────────────────────────────────────────────

screenshotEachMode('MultichainSwapAmountCard', () => (
    <div className="w-[358px] bg-backgroundPage p-4 md:w-[520px]">
        <MultichainSwapAmountCard
            label="You send"
            asset={ton}
            amount="12.5"
            onAmount={() => {}}
            onAsset={() => {}}
            onMax={() => {}}
            balance="42.75"
            fiat="$37.14"
        />
    </div>
));

screenshotEachMode('MultichainSwapAmountCard error', () => (
    <div className="w-[358px] bg-backgroundPage p-4 md:w-[520px]">
        <MultichainSwapAmountCard
            label="You send"
            asset={ton}
            amount="100"
            onAmount={() => {}}
            onAsset={() => {}}
            onMax={() => {}}
            balance="42.75"
            error="Not enough funds"
        />
    </div>
));

screenshotEachMode('MultichainSwapAmountCard no quote', () => (
    <div className="w-[358px] bg-backgroundPage p-4 md:w-[520px]">
        <MultichainSwapAmountCard
            label="Receive"
            asset={ton}
            amount=""
            placeholder="No quote"
            onAsset={() => {}}
            balance="0"
            fiat="$0.00"
        />
    </div>
));

screenshotEachMode('MultichainSwapAmountCard receive', () => (
    <div className="w-[358px] bg-backgroundPage p-4 md:w-[520px]">
        <MultichainSwapAmountCard
            label="You receive"
            asset={eth}
            amount=""
            onAsset={() => {}}
            balance="0.56"
        />
    </div>
));

test('MultichainSwapAmountCard shows the wallet balance and MAX', async ({ mount }) => {
    let maxClicked = false;
    const component = await mount(
        <MultichainSwapAmountCard
            label="You send"
            asset={ton}
            amount="12.5"
            onAmount={() => {}}
            onAsset={() => {}}
            onMax={() => {
                maxClicked = true;
            }}
            balance="42.75"
        />
    );

    await expect(component).toContainText('Balance: 42.75');
    await component.getByRole('button', { name: 'MAX' }).click();
    expect(maxClicked).toBe(true);
});

test('MultichainSwapAmountCard caps fraction digits at the asset decimals', async ({ mount }) => {
    const component = await mount(<MultichainSwapAmountCardHarness asset={usdtEth} />);
    const input = component.getByRole('textbox');

    await input.pressSequentially('1.1234567');
    await expect(input).toHaveValue('1.123456');

    await input.fill('');
    await input.pressSequentially('0,5');
    await expect(input).toHaveValue('0.5');
});

// ─── Asset picker ─────────────────────────────────────────────────

screenshotEachMode('MultichainSwapAssetPicker', () => (
    <div className="flex h-[560px] w-[358px] flex-col bg-backgroundPage p-4 md:w-[520px]">
        <AssetPicker
            assets={PICKER_ASSETS}
            walletAssets={walletAssets}
            counterpart={undefined}
            selected={ton}
            onSelect={() => {}}
        />
    </div>
));

test('AssetPicker marks the selected asset', async ({ mount }) => {
    const c = await mount(
        <div className="flex h-[560px] w-[358px] flex-col">
            <AssetPicker
                assets={PICKER_ASSETS}
                walletAssets={walletAssets}
                counterpart={undefined}
                selected={eth}
                onSelect={() => {}}
            />
        </div>
    );
    const selectedRow = c.locator('button[aria-current]');
    await expect(selectedRow).toHaveCount(1);
    await expect(selectedRow).toContainText('ETH');
});

// Asset rows by accessible name: the symbol, then the optional network chip,
// then the balance. A bare exact-text lookup would also match the network
// chip of the same name, whose name is the symbol alone.
const assetRow = (c: Locator, symbol: string) =>
    c.getByRole('button', { name: new RegExp(`^${symbol} .*\\d`) });

test('AssetPicker lists the server matches for a query', async ({ mount }) => {
    const c = await mount(
        <AssetPickerSearchHarness
            assets={PICKER_ASSETS}
            catalog={PICKER_ASSETS}
            walletAssets={walletAssets}
        />
    );
    await expect(assetRow(c, 'TON')).toBeVisible();
    await c.getByRole('searchbox').fill('tether');
    await expect(assetRow(c, 'TON')).toHaveCount(0);
    await expect(assetRow(c, 'USDT')).toHaveCount(2);
});

test('AssetPicker search reaches past the local list', async ({ mount }) => {
    const hakka: CrossSwapAsset = {
        ...usdtEth,
        assetId: 'eth/mainnet/erc20/0x0e29e5abbb5fd88e28b2d355774e73bd47de3bcd',
        symbol: 'HAKKA',
        name: 'Hakka.Finance'
    };
    let query = '';
    const c = await mount(
        <AssetPickerSearchHarness
            assets={PICKER_ASSETS}
            catalog={[...PICKER_ASSETS, hakka]}
            walletAssets={walletAssets}
            onSearchChange={value => (query = value)}
        />
    );
    await expect(assetRow(c, 'HAKKA')).toHaveCount(0);
    await c.getByRole('searchbox').fill('hak');
    expect(query).toBe('hak');
    await expect(assetRow(c, 'HAKKA')).toBeVisible();
    await expect(assetRow(c, 'TON')).toHaveCount(0);
});

test('AssetPicker holds a skeleton until the server answers', async ({ mount }) => {
    const c = await mount(
        <div className="flex h-[560px] w-[358px] flex-col">
            <AssetPicker
                assets={PICKER_ASSETS}
                walletAssets={walletAssets}
                counterpart={undefined}
                selected={undefined}
                onSelect={() => {}}
            />
        </div>
    );
    await expect(assetRow(c, 'TON')).toBeVisible();
    await c.getByRole('searchbox').fill('tether');
    await expect(assetRow(c, 'TON')).toHaveCount(0);
    await expect(assetRow(c, 'USDT')).toHaveCount(0);
    await expect(c.getByText('Not Found')).toHaveCount(0);
});

test('AssetPicker chain chip narrows the list to one network', async ({ mount }) => {
    let reported: { query: string; chainId: string | undefined } | undefined;
    const c = await mount(
        <AssetPickerSearchHarness
            assets={PICKER_ASSETS}
            catalog={PICKER_ASSETS}
            walletAssets={walletAssets}
            onSearchChange={(query, chainId) => (reported = { query, chainId })}
        />
    );
    await c.getByRole('button', { name: 'Tron', exact: true }).click();
    await expect(assetRow(c, 'USDT')).toHaveCount(1);
    await expect(assetRow(c, 'TON')).toHaveCount(0);
    // The chain goes to the server search as the asset id head, not a label.
    expect(reported).toEqual({ query: '', chainId: 'tron/mainnet' });
});

test('source AssetPicker only shows assets with a positive wallet balance', async ({ mount }) => {
    const c = await mount(
        <div className="flex h-[560px] w-[358px] flex-col">
            <AssetPicker
                assets={PICKER_ASSETS}
                walletAssets={walletAssets}
                counterpart={undefined}
                selected={undefined}
                requirePositiveBalance
                onSelect={() => {}}
            />
        </div>
    );

    await expect(assetRow(c, 'TON')).toBeVisible();
    await expect(assetRow(c, 'ETH')).toBeVisible();
    await expect(assetRow(c, 'USDT')).toHaveCount(0);
});

test('source AssetPicker explains when the selected chain has no assets to swap', async ({
    mount
}) => {
    const c = await mount(
        <AssetPickerSearchHarness
            assets={PICKER_ASSETS}
            catalog={PICKER_ASSETS}
            walletAssets={walletAssets}
            requirePositiveBalance
        />
    );

    await c.getByRole('button', { name: 'Tron', exact: true }).click();
    await expect(c.getByText('You have no matching assets to swap')).toBeVisible();
});

test('source AssetPicker tells a zero balance apart from a missed search', async ({ mount }) => {
    const c = await mount(
        <AssetPickerSearchHarness
            assets={PICKER_ASSETS}
            catalog={PICKER_ASSETS}
            walletAssets={walletAssets}
            requirePositiveBalance
        />
    );

    // The catalog has USDT; the wallet holds none of it.
    await c.getByRole('searchbox').fill('usdt');
    await expect(c.getByText('You have no matching assets to swap')).toBeVisible();
    await expect(c.getByText('Not Found')).toHaveCount(0);

    await c.getByRole('searchbox').fill('zzz');
    await expect(c.getByText('Not Found')).toBeVisible();
    await expect(c.getByText('There were no results for ‘zzz’.')).toBeVisible();
});

test('destination AssetPicker keeps assets with a zero wallet balance', async ({ mount }) => {
    const c = await mount(
        <div className="flex h-[560px] w-[358px] flex-col">
            <AssetPicker
                assets={PICKER_ASSETS}
                walletAssets={walletAssets}
                counterpart={undefined}
                selected={undefined}
                onSelect={() => {}}
            />
        </div>
    );

    await expect(assetRow(c, 'USDT')).toHaveCount(2);
});

test('AssetPicker honours the counterpart allowed-pairs whitelist', async ({ mount }) => {
    const c = await mount(
        <div className="flex h-[560px] w-[358px] flex-col">
            <AssetPicker
                assets={PICKER_ASSETS}
                walletAssets={walletAssets}
                counterpart={restrictedStock}
                selected={undefined}
                onSelect={() => {}}
            />
        </div>
    );
    // bTSLA may only pair with USDT on Ethereum.
    await expect(assetRow(c, 'USDT')).toHaveCount(1);
    await expect(assetRow(c, 'TON')).toHaveCount(0);
    await expect(assetRow(c, 'ETH')).toHaveCount(0);
});

// ─── Detail rows ──────────────────────────────────────────────────

const SLIPPAGE_OPTIONS_BPS = [10, 50, 100, 300];

screenshot('MultichainSwapDetailRows', () => (
    <div className="w-[520px] bg-backgroundPage p-4">
        <div className="rounded-medium bg-backgroundContent">
            <DetailRow label="Rate" value="1 TON ≈ 0.000882 ETH" />
            <DetailRow
                label="Slippage"
                value={
                    <SlippageSelect
                        label="Slippage"
                        valueBps={100}
                        optionsBps={SLIPPAGE_OPTIONS_BPS}
                        onChange={() => {}}
                    />
                }
            />
            <DetailRow label="Minimum received" value="≈ 0.0044 ETH" description="≈ $7.14" />
            <ValueDifferenceRow label="Value difference" bps={-412} />
            <ValueDifferenceRow label="Value difference" bps={-841} />
            <DetailRow label="Network fee" value="≈ 0.13 TON" description="Estimated time: 1 sec" />
        </div>
    </div>
));

test('SlippageSelect opens the preset list from the value and marks the current one', async ({
    mount
}) => {
    const c = await mount(
        <div className="h-[280px] w-[520px] bg-backgroundPage p-4">
            <div className="rounded-medium bg-backgroundContent">
                <DetailRow
                    label="Slippage"
                    value={
                        <SlippageSelect
                            label="Slippage"
                            valueBps={100}
                            optionsBps={SLIPPAGE_OPTIONS_BPS}
                            onChange={() => {}}
                        />
                    }
                />
            </div>
        </div>
    );
    await expect(c.getByText('0.5%')).not.toBeVisible();
    await c.getByRole('button', { name: 'Slippage' }).click();
    await expect(c.getByText('0.5%')).toBeVisible();
    const checked = c.locator('button[aria-pressed="true"]');
    await expect(checked).toHaveCount(1);
    await expect(checked).toHaveText('1%');
});
