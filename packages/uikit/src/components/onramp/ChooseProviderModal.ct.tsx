import type { OnrampQuoteResult } from '@tonkeeper/core/dist/onrampApi';
import { ChooseProviderModal } from './ChooseProviderModal';
import { expect, screenshotEachMode, test } from '../../../playwright/test';
import type { Route } from 'playwright-core';
import { readFile } from 'fs/promises';
import path from 'path';

const noop = () => {};

const quote = (overrides: Partial<OnrampQuoteResult>): OnrampQuoteResult => ({
    merchant: 'mercuryo',
    paymentMethod: 'card',
    amountIn: '20',
    amountOut: '5.576',
    rate: '0.2788',
    fees: { total: '0' },
    dateExpire: '2099-01-01T00:00:00Z',
    merchantTransactionId: 'tx-1',
    ...overrides
});

const merchantImages: Record<string, string> = {
    mercuryo: 'https://assets.tonkeeper.test/onramp/merchant-mercuryo.jpg',
    moonpay: 'https://assets.tonkeeper.test/onramp/merchant-moonpay.jpg',
    changelly: 'https://assets.tonkeeper.test/onramp/merchant-changelly.jpeg',
    transak: 'https://assets.tonkeeper.test/onramp/merchant-transak.webp'
};

const testAssetsDir = path.resolve(process.cwd(), '../../tests/playwright/test-assets');

const merchantImageAssetByUrl: Record<string, { fileName: string; contentType: string }> = {
    [merchantImages.mercuryo]: { fileName: 'duck1.jpg', contentType: 'image/jpeg' },
    [merchantImages.moonpay]: { fileName: 'duck2.jpg', contentType: 'image/jpeg' },
    [merchantImages.changelly]: { fileName: 'duck3.jpeg', contentType: 'image/jpeg' },
    [merchantImages.transak]: { fileName: 'duck4.webp', contentType: 'image/webp' }
};

type ScreenshotOptions = NonNullable<Parameters<typeof screenshotEachMode>[3]>;
type SetupPage = NonNullable<ScreenshotOptions['setupPage']>;

const setupImageMocks: SetupPage = async page => {
    const merchantImageDataByUrl: Record<string, { body: Buffer; contentType: string }> = {};
    for (const [url, asset] of Object.entries(merchantImageAssetByUrl)) {
        merchantImageDataByUrl[url] = {
            body: await readFile(path.join(testAssetsDir, asset.fileName)),
            contentType: asset.contentType
        };
    }

    await page.route('**/onramp/merchant-*.*', async (route: Route) => {
        const imageData = merchantImageDataByUrl[route.request().url()];
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
    'ChooseProviderModal single item',
    () => (
        <ChooseProviderModal
            isOpen
            onClose={noop}
            onBack={noop}
            onSelect={noop}
            items={[quote({ merchant: 'mercuryo', rate: '0.2788' })]}
            suggested={[]}
            selectedMerchant="mercuryo"
            bestMerchant="mercuryo"
            fiat="USD"
            symbol="TON"
            merchantImageBySlug={merchantImages}
        />
    ),
    undefined,
    { target: 'dialog', setupPage: setupImageMocks }
);

screenshotEachMode(
    'ChooseProviderModal multiple items',
    () => (
        <ChooseProviderModal
            isOpen
            onClose={noop}
            onBack={noop}
            onSelect={noop}
            items={[
                quote({ merchant: 'mercuryo', rate: '0.2788' }),
                quote({ merchant: 'moonpay', rate: '0.2700', merchantTransactionId: 'tx-2' })
            ]}
            suggested={[]}
            selectedMerchant="mercuryo"
            bestMerchant="mercuryo"
            fiat="USD"
            symbol="TON"
            merchantImageBySlug={merchantImages}
        />
    ),
    undefined,
    { target: 'dialog', setupPage: setupImageMocks }
);

screenshotEachMode(
    'ChooseProviderModal with suggested',
    () => (
        <ChooseProviderModal
            isOpen
            onClose={noop}
            onBack={noop}
            onSelect={noop}
            items={[quote({ merchant: 'mercuryo', rate: '0.2788' })]}
            suggested={[
                quote({
                    merchant: 'changelly',
                    rate: '0.38',
                    minAmount: '30',
                    merchantTransactionId: 'tx-3'
                }),
                quote({
                    merchant: 'transak',
                    rate: '0.41',
                    minAmount: '100',
                    merchantTransactionId: 'tx-4'
                })
            ]}
            selectedMerchant="mercuryo"
            bestMerchant="mercuryo"
            fiat="USD"
            symbol="TON"
            merchantImageBySlug={merchantImages}
        />
    ),
    undefined,
    { target: 'dialog', setupPage: setupImageMocks }
);

screenshotEachMode(
    'ChooseProviderModal selection off-best',
    () => (
        <ChooseProviderModal
            isOpen
            onClose={noop}
            onBack={noop}
            onSelect={noop}
            items={[
                quote({ merchant: 'mercuryo', rate: '0.2788' }),
                quote({ merchant: 'moonpay', rate: '0.2700', merchantTransactionId: 'tx-2' })
            ]}
            suggested={[]}
            selectedMerchant="moonpay"
            bestMerchant="mercuryo"
            fiat="USD"
            symbol="TON"
            merchantImageBySlug={merchantImages}
        />
    ),
    undefined,
    { target: 'dialog', setupPage: setupImageMocks }
);

test('ChooseProviderModal back arrow fires onBack', async ({ mount, page }) => {
    let backs = 0;
    await mount(
        <ChooseProviderModal
            isOpen
            onClose={noop}
            onBack={() => backs++}
            onSelect={noop}
            items={[quote({ merchant: 'mercuryo', rate: '0.2788' })]}
            suggested={[]}
            fiat="USD"
            symbol="TON"
        />
    );
    await page.getByRole('button', { name: 'Back' }).click();
    expect(backs).toBe(1);
});
