import { ChooseAssetScreen } from './ChooseAssetScreen';
import { OnrampAsset } from '@tonkeeper/core/dist/onrampApi';
import { expect, screenshotEachMode, test } from '../../../playwright/test';
import type { Route } from 'playwright-core';
import { readFile } from 'fs/promises';
import path from 'path';

const noop = () => {};
const filterProps = { search: '', onSearchChange: noop, onChainChange: noop };
const testAssetsDir = path.resolve(process.cwd(), '../../tests/playwright/test-assets');

const imageUrls = {
    ton: 'https://assets.tonkeeper.test/onramp/asset-ton.jpg',
    btc: 'https://assets.tonkeeper.test/onramp/asset-btc.jpg',
    eth: 'https://assets.tonkeeper.test/onramp/asset-eth.jpeg',
    usdtTon: 'https://assets.tonkeeper.test/onramp/asset-usdt-ton.webp',
    usdtTron: 'https://assets.tonkeeper.test/onramp/asset-usdt-tron.jpg',
    usdcEth: 'https://assets.tonkeeper.test/onramp/asset-usdc-eth.jpeg'
} as const;

const imageAssetByUrl: Record<string, { fileName: string; contentType: string }> = {
    [imageUrls.ton]: { fileName: 'duck1.jpg', contentType: 'image/jpeg' },
    [imageUrls.btc]: { fileName: 'duck2.jpg', contentType: 'image/jpeg' },
    [imageUrls.eth]: { fileName: 'duck3.jpeg', contentType: 'image/jpeg' },
    [imageUrls.usdtTon]: { fileName: 'duck4.webp', contentType: 'image/webp' },
    [imageUrls.usdtTron]: { fileName: 'duck1.jpg', contentType: 'image/jpeg' },
    [imageUrls.usdcEth]: { fileName: 'duck2.jpg', contentType: 'image/jpeg' }
};

const asset = (overrides: {
    assetId: string;
    symbol: string;
    name?: string;
    image?: string;
}): OnrampAsset => ({
    assetId: overrides.assetId,
    symbol: overrides.symbol,
    name: overrides.name,
    image: overrides.image,
    decimals: 6,
    stablecoin: overrides.symbol === 'USDT' || overrides.symbol === 'USDC',
    extraIdRequired: false,
    availableMethods: ['card'],
    availableFiats: ['USD']
});

const fixtureAssets: OnrampAsset[] = [
    asset({
        assetId: 'ton/mainnet/coin',
        symbol: 'TON',
        name: 'Toncoin',
        image: imageUrls.ton
    }),
    asset({
        assetId: 'btc/mainnet/coin',
        symbol: 'BTC',
        name: 'Bitcoin',
        image: imageUrls.btc
    }),
    asset({
        assetId: 'eth/mainnet/coin',
        symbol: 'ETH',
        name: 'Ethereum',
        image: imageUrls.eth
    }),
    asset({
        assetId: 'ton/mainnet/jetton/usdt',
        symbol: 'USDT',
        name: 'Tether',
        image: imageUrls.usdtTon
    }),
    asset({
        assetId: 'tron/mainnet/token/usdt',
        symbol: 'USDT',
        name: 'Tether',
        image: imageUrls.usdtTron
    }),
    asset({
        assetId: 'eth/mainnet/token/usdc',
        symbol: 'USDC',
        name: 'USD Coin',
        image: imageUrls.usdcEth
    })
];

const fixtureChains = ['ton', 'btc', 'eth', 'tron'];

type ScreenshotOptions = NonNullable<Parameters<typeof screenshotEachMode>[3]>;
type SetupPage = NonNullable<ScreenshotOptions['setupPage']>;

const setupImageMocks: SetupPage = async page => {
    const imageDataByUrl: Record<string, { body: Buffer; contentType: string }> = {};
    for (const [url, imageAsset] of Object.entries(imageAssetByUrl)) {
        imageDataByUrl[url] = {
            body: await readFile(path.join(testAssetsDir, imageAsset.fileName)),
            contentType: imageAsset.contentType
        };
    }

    await page.route('**/onramp/*.*', async (route: Route) => {
        const imageData = imageDataByUrl[route.request().url()];
        if (!imageData) {
            await route.fulfill({ status: 404 });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: imageData.contentType,
            body: imageData.body
        });
    });
};

screenshotEachMode(
    'ChooseAssetScreen with assets',
    () => (
        <ChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            onBack={noop}
            selectedAssetId="ton/mainnet/jetton/usdt"
            assets={fixtureAssets}
            chains={fixtureChains}
            {...filterProps}
        />
    ),
    undefined,
    { target: 'dialog', setupPage: setupImageMocks }
);

screenshotEachMode(
    'ChooseAssetScreen loading',
    () => (
        <ChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            onBack={noop}
            isLoading
            {...filterProps}
        />
    ),
    undefined,
    { target: 'dialog' }
);

screenshotEachMode(
    'ChooseAssetScreen error',
    () => (
        <ChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            onBack={noop}
            isError
            {...filterProps}
        />
    ),
    undefined,
    { target: 'dialog' }
);

test('a failed configuration read offers a retry, not an empty catalog', async ({
    mount,
    page
}) => {
    let retried = 0;
    await mount(
        <ChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            isError
            onRetry={() => (retried += 1)}
            {...filterProps}
        />
    );
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('No assets found')).toHaveCount(0);
    await dialog.getByRole('button', { name: 'Retry' }).click();
    expect(retried).toBe(1);
});

test('the backend name is the subtitle, even when it repeats the symbol', async ({
    mount,
    page
}) => {
    await mount(
        <ChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            assets={[
                asset({ assetId: 'bsc/mainnet/coin', symbol: 'BNB', name: 'BNB' }),
                asset({ assetId: 'btc/mainnet/coin', symbol: 'BTC', name: 'Bitcoin' }),
                asset({ assetId: 'tron/mainnet/coin', symbol: 'TRX' })
            ]}
            chains={fixtureChains}
            {...filterProps}
        />
    );
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'BTC Bitcoin', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'BNB BNB', exact: true })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'TRX', exact: true })).toBeVisible();
});

test('a failed next page keeps the loaded rows and offers a retry', async ({ mount, page }) => {
    let retried = 0;
    await mount(
        <ChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            assets={fixtureAssets}
            chains={fixtureChains}
            isError
            hasNextPage
            onRetry={() => (retried += 1)}
            {...filterProps}
        />
    );
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('BTC').first()).toBeVisible();
    await dialog.getByRole('button', { name: 'Retry' }).click();
    expect(retried).toBe(1);
});

screenshotEachMode(
    'ChooseAssetScreen empty',
    () => (
        <ChooseAssetScreen
            isOpen
            onClose={noop}
            onSelect={noop}
            onBack={noop}
            assets={[]}
            chains={fixtureChains}
            {...filterProps}
        />
    ),
    undefined,
    { target: 'dialog' }
);
