import { AddFundsSheet } from './AddFundsSheet';
import type { ExchangeLayoutCard } from '@tonkeeper/core/dist/onrampApi';
import { expect, screenshotEachMode, test } from '../../../playwright/test';
import type { Route } from 'playwright-core';
import { readFile } from 'fs/promises';
import path from 'path';

const noop = () => {};

const applePayImageUrl = 'https://assets.tonkeeper.test/onramp/apple-pay.jpg';
const p2pImageUrl = 'https://assets.tonkeeper.test/onramp/p2p.webp';
const testAssetsDir = path.resolve(process.cwd(), '../../tests/playwright/test-assets');

const imageAssetByUrl: Record<string, { fileName: string; contentType: string }> = {
    [applePayImageUrl]: { fileName: 'duck2.jpg', contentType: 'image/jpeg' },
    [p2pImageUrl]: { fileName: 'duck3.jpeg', contentType: 'image/jpeg' }
};

type ScreenshotOptions = NonNullable<Parameters<typeof screenshotEachMode>[3]>;
type SetupPage = NonNullable<ScreenshotOptions['setupPage']>;

const setupImageMocks: SetupPage = async page => {
    const imageDataByUrl: Record<string, { body: Buffer; contentType: string }> = {};
    for (const [url, asset] of Object.entries(imageAssetByUrl)) {
        imageDataByUrl[url] = {
            body: await readFile(path.join(testAssetsDir, asset.fileName)),
            contentType: asset.contentType
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

const applePay: ExchangeLayoutCard = {
    title: 'Buy with Apple Pay',
    description: 'Or card, P2P & other',
    image: applePayImageUrl,
    preferredCurrency: 'USD'
};

const p2p: ExchangeLayoutCard = {
    title: 'Buy with P2P Market',
    description: 'Buy crypto from other users',
    image: p2pImageUrl,
    preferredCurrency: 'RUB'
};

screenshotEachMode(
    'AddFundsSheet international',
    () => <AddFundsSheet isOpen onClose={noop} onReceive={noop} onBuy={noop} cards={[applePay]} />,
    undefined,
    { target: 'dialog', setupPage: setupImageMocks }
);

screenshotEachMode(
    'AddFundsSheet russia',
    () => <AddFundsSheet isOpen onClose={noop} onReceive={noop} onBuy={noop} cards={[p2p]} />,
    undefined,
    { target: 'dialog', setupPage: setupImageMocks }
);

screenshotEachMode(
    'AddFundsSheet loading',
    () => <AddFundsSheet isOpen onClose={noop} onReceive={noop} onBuy={noop} isLoading />,
    undefined,
    { target: 'dialog' }
);

test('Receive stays usable while the buy options load', async ({ mount, page }) => {
    let receiveClicks = 0;
    await mount(
        <AddFundsSheet
            isOpen
            onClose={noop}
            onReceive={() => (receiveClicks += 1)}
            onBuy={noop}
            isLoading
        />
    );

    const receive = page.getByRole('button', { name: /Receive tokens/ });
    await expect(receive).toBeEnabled();
    await receive.click();
    expect(receiveClicks).toBe(1);
});
