import type { Page } from 'playwright-core';

import { expect, screenshotEachMode, test } from '../../../../playwright/test';
import { SendChooseAssetScreen } from './SendChooseAssetScreen';

const noop = () => {};

const WALLET_ASSETS_URL = /\/api\/v1\/wallets\/[^/]+\/assets\?/;

const walletAsset = (assetId: string, symbol: string, name: string, balance: string) => ({
    asset: {
        asset_id: assetId,
        chain: assetId.split('/')[0],
        name,
        symbol,
        decimals: 6,
        image: '',
        verification: 'trusted'
    },
    address: '',
    balance,
    is_hidden: false,
    price: { prices: { USD: 1 } }
});

const USDT_TON = walletAsset(
    'ton/mainnet/jetton/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    'USD₮',
    'Tether USD',
    '25000000'
);
const USDT_TRON = walletAsset(
    'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    'USD₮',
    'Tether USD',
    '12000000'
);
const USDC_ETH = walletAsset(
    'eth/mainnet/erc20/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    'USDC',
    'USD Coin',
    '7000000'
);

/**
 * Answers the wallet-assets endpoint the way the backend searches: `search`
 * picks the rows, so the test sees exactly what the picker asked for.
 */
const routeWalletAssets = async (
    page: Page,
    respond: (params: URLSearchParams) => unknown[],
    requests: URLSearchParams[] = []
) => {
    await page.route(WALLET_ASSETS_URL, route => {
        const params = new URL(route.request().url()).searchParams;
        requests.push(params);
        return route.fulfill({
            json: { assets: respond(params), fiat_price: {}, next_cursor: '' }
        });
    });
};

screenshotEachMode(
    'SendChooseAsset empty',
    () => <SendChooseAssetScreen isOpen onClose={noop} onSelect={noop} onAddFunds={noop} />,
    ['desktop', 'mobile'],
    { target: 'dialog', setupPage: page => routeWalletAssets(page, () => []) }
);

test('SendChooseAsset shows the empty state with an Add Funds action', async ({ mount, page }) => {
    await routeWalletAssets(page, () => []);
    let added = 0;
    await mount(
        <SendChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            onAddFunds={() => (added += 1)}
        />
    );
    await expect(page.getByText('Nothing to send yet')).toBeVisible();
    const addFunds = page.getByRole('button', { name: 'Add Funds' });
    await expect(addFunds).toBeVisible();
    await addFunds.click();
    expect(added).toBe(1);
});

test('SendChooseAsset renders the search field', async ({ mount, page }) => {
    await routeWalletAssets(page, () => []);
    await mount(<SendChooseAssetScreen isOpen onClose={noop} onSelect={noop} onAddFunds={noop} />);
    await expect(page.getByPlaceholder('Search by ticker or name')).toBeVisible();
});

test('SendChooseAsset asks the backend for the holdings it can send', async ({ mount, page }) => {
    const requests: URLSearchParams[] = [];
    await routeWalletAssets(page, () => [USDT_TON, USDC_ETH], requests);
    await mount(<SendChooseAssetScreen isOpen onClose={noop} onSelect={noop} onAddFunds={noop} />);

    await expect(page.getByRole('button', { name: /USDC/ })).toBeVisible();
    expect(requests[0].get('available_only')).toBe('true');
    expect(requests[0].has('search')).toBe(false);
});

test('SendChooseAsset searches on the backend: usdt lists USD₮ on every network', async ({
    mount,
    page
}) => {
    const requests: URLSearchParams[] = [];
    await routeWalletAssets(
        page,
        params => (params.get('search') === 'usdt' ? [USDT_TON, USDT_TRON] : [USDC_ETH]),
        requests
    );
    await mount(<SendChooseAssetScreen isOpen onClose={noop} onSelect={noop} onAddFunds={noop} />);
    await expect(page.getByRole('button', { name: /USDC/ })).toBeVisible();

    await page.getByPlaceholder('Search by ticker or name').fill('usdt');

    await expect(page.getByRole('button', { name: /USD₮/ })).toHaveCount(2);
    await expect(page.getByRole('button', { name: /USDC/ })).toHaveCount(0);
    expect(requests.some(params => params.get('search') === 'usdt')).toBe(true);
});

test('SendChooseAsset says nothing matched without the wallet empty state', async ({
    mount,
    page
}) => {
    await routeWalletAssets(page, params => (params.get('search') ? [] : [USDC_ETH]));
    await mount(<SendChooseAssetScreen isOpen onClose={noop} onSelect={noop} onAddFunds={noop} />);
    await expect(page.getByRole('button', { name: /USDC/ })).toBeVisible();

    await page.getByPlaceholder('Search by ticker or name').fill('zzz');

    await expect(page.getByText('No assets found')).toBeVisible();
    await expect(page.getByText('Nothing to send yet')).toHaveCount(0);
});

test('SendChooseAsset filters chains on the backend', async ({ mount, page }) => {
    const requests: URLSearchParams[] = [];
    await routeWalletAssets(page, () => [USDC_ETH], requests);
    await mount(<SendChooseAssetScreen isOpen onClose={noop} onSelect={noop} onAddFunds={noop} />);
    await expect(page.getByRole('button', { name: /USDC/ })).toBeVisible();

    await page.getByRole('button', { name: 'Tron', exact: true }).click();

    await expect.poll(() => requests.some(params => params.get('chain') === 'tron')).toBe(true);
});

test('SendChooseAsset offers a chip for every network the wallet holds an address on', async ({
    mount,
    page
}) => {
    await routeWalletAssets(page, () => []);
    await mount(<SendChooseAssetScreen isOpen onClose={noop} onSelect={noop} onAddFunds={noop} />);
    for (const label of [
        'All',
        'TON',
        'Tron',
        'Ethereum',
        'Bitcoin',
        'Base',
        'BNB Smart Chain',
        'Arbitrum'
    ]) {
        await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
    }
});

test('SendChooseAsset scopes the chips to the allowed networks', async ({ mount, page }) => {
    await routeWalletAssets(page, () => []);
    await mount(
        <SendChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            onAddFunds={noop}
            allowedNetworks={['eth', 'base']}
        />
    );
    await expect(page.getByRole('button', { name: 'Ethereum', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Base', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'TON', exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tron', exact: true })).toHaveCount(0);
});
