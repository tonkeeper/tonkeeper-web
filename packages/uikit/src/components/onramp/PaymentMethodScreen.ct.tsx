import { PaymentMethodScreen } from './PaymentMethodScreen';
import { ExchangePaymentMethodType, OnrampPaymentMethod } from '@tonkeeper/core/dist/onrampApi';
import { expect, screenshotEachMode, test } from '../../../playwright/test';
import type { Route } from 'playwright-core';
import { readFile } from 'fs/promises';
import path from 'path';

const noop = () => {};

const testAssetsDir = path.resolve(process.cwd(), '../../tests/playwright/test-assets');
const paymentMethodAssetByType: Partial<
    Record<ExchangePaymentMethodType, { fileName: string; contentType: string }>
> = {
    apple_pay: { fileName: 'duck1.jpg', contentType: 'image/jpeg' },
    card: { fileName: 'duck2.jpg', contentType: 'image/jpeg' },
    paypal: { fileName: 'duck3.jpeg', contentType: 'image/jpeg' },
    revolut: { fileName: 'duck4.webp', contentType: 'image/webp' },
    venmo: { fileName: 'duck1.jpg', contentType: 'image/jpeg' },
    volt: { fileName: 'duck2.jpg', contentType: 'image/jpeg' },
    p2p: { fileName: 'duck4.webp', contentType: 'image/webp' }
};

type ScreenshotOptions = NonNullable<Parameters<typeof screenshotEachMode>[3]>;
type SetupPage = NonNullable<ScreenshotOptions['setupPage']>;

const setupImageMocks: SetupPage = async page => {
    const imageDataByUrl: Record<string, { body: Buffer; contentType: string }> = {};
    for (const [type, asset] of Object.entries(paymentMethodAssetByType)) {
        const url = `https://assets.tonkeeper.test/onramp/payment-method-${type}.png`;
        imageDataByUrl[url] = {
            body: await readFile(path.join(testAssetsDir, asset.fileName)),
            contentType: asset.contentType
        };
    }

    await page.route('**/onramp/payment-method-*.png', async (route: Route) => {
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

const method = (type: ExchangePaymentMethodType, name: string): OnrampPaymentMethod => ({
    type,
    name,
    image: `https://assets.tonkeeper.test/onramp/payment-method-${type}.png`,
    providers: [{ merchant: 'mercuryo', fiat: 'USD' }]
});

const fixtureMethods: OnrampPaymentMethod[] = [
    method('apple_pay', 'Apple Pay'),
    method('card', 'Card'),
    method('paypal', 'PayPal'),
    method('revolut', 'Revolut Pay'),
    method('venmo', 'Venmo'),
    method('volt', 'Volt'),
    method('p2p', 'P2P Market')
];

screenshotEachMode(
    'PaymentMethodScreen with methods',
    () => (
        <PaymentMethodScreen
            isOpen
            onClose={noop}
            onBack={noop}
            onSelect={noop}
            onSelectP2P={noop}
            assetId="ton/mainnet/coin"
            fiat="USD"
            methods={fixtureMethods}
        />
    ),
    undefined,
    { target: 'dialog', setupPage: setupImageMocks }
);

screenshotEachMode(
    'PaymentMethodScreen loading',
    () => (
        <PaymentMethodScreen
            isOpen
            onClose={noop}
            onBack={noop}
            onSelect={noop}
            onSelectP2P={noop}
            assetId="ton/mainnet/coin"
            fiat="USD"
            isLoading
        />
    ),
    undefined,
    { target: 'dialog' }
);

screenshotEachMode(
    'PaymentMethodScreen empty',
    () => (
        <PaymentMethodScreen
            isOpen
            onClose={noop}
            onBack={noop}
            onSelect={noop}
            onSelectP2P={noop}
            assetId="ton/mainnet/coin"
            fiat="USD"
            methods={[]}
        />
    ),
    undefined,
    { target: 'dialog' }
);

test('PaymentMethodScreen back arrow fires onBack', async ({ mount, page }) => {
    let backs = 0;
    await mount(
        <PaymentMethodScreen
            isOpen
            onClose={noop}
            onBack={() => backs++}
            onSelect={noop}
            onSelectP2P={noop}
            assetId="ton/mainnet/coin"
            fiat="USD"
            methods={fixtureMethods}
        />
    );
    await page.getByRole('button', { name: 'Back' }).click();
    expect(backs).toBe(1);
});
