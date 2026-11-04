import type { OnrampQuoteResult } from '@tonkeeper/core/dist/onrampApi';
import { ProviderCard } from './ProviderCard';
import { screenshotEachMode } from '../../../playwright/test';
import type { Route } from 'playwright-core';
import { readFile } from 'fs/promises';
import path from 'path';

const noop = () => {};
const mercuryoImageUrl = 'https://assets.tonkeeper.test/onramp/merchant-mercuryo.jpg';
const testAssetsDir = path.resolve(process.cwd(), '../../tests/playwright/test-assets');

type ScreenshotOptions = NonNullable<Parameters<typeof screenshotEachMode>[3]>;
type SetupPage = NonNullable<ScreenshotOptions['setupPage']>;

const setupImageMocks: SetupPage = async page => {
    const body = await readFile(path.join(testAssetsDir, 'duck1.jpg'));

    await page.route('**/onramp/merchant-*.*', async (route: Route) => {
        await route.fulfill({
            status: 200,
            contentType: 'image/jpeg',
            body
        });
    });
};

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

// Single provider — no switch chevron, no BEST badge, rate row visible.
screenshotEachMode(
    'ProviderCard single',
    () => (
        <ProviderCard
            quote={quote({ merchant: 'mercuryo' })}
            fiat="USD"
            symbol="TON"
            image={mercuryoImageUrl}
            isLoading={false}
            isBest={false}
            belowMin={false}
            showSwitch={false}
        />
    ),
    undefined,
    { target: 'component', setupPage: setupImageMocks }
);

// Best of several — BEST badge, switch chevron, rate row.
screenshotEachMode(
    'ProviderCard best of many',
    () => (
        <ProviderCard
            quote={quote({ merchant: 'mercuryo' })}
            fiat="USD"
            symbol="TON"
            image={mercuryoImageUrl}
            isLoading={false}
            isBest
            belowMin={false}
            showSwitch
            onClick={noop}
        />
    ),
    undefined,
    { target: 'component', setupPage: setupImageMocks }
);

// Typed amount below the merchant's minimum — yellow "Min. amount" line
// replaces the rate, BEST badge suppressed.
screenshotEachMode(
    'ProviderCard below min',
    () => (
        <ProviderCard
            quote={quote({ merchant: 'mercuryo', minAmount: '20' })}
            fiat="USD"
            symbol="TON"
            image={mercuryoImageUrl}
            isLoading={false}
            isBest
            belowMin
            showSwitch
            onClick={noop}
        />
    ),
    undefined,
    { target: 'component', setupPage: setupImageMocks }
);

// Off-ramp direction — the rate reads crypto → fiat and the minimum is in
// the asset's units.
screenshotEachMode(
    'ProviderCard sell below min',
    () => (
        <ProviderCard
            quote={quote({ merchant: 'mercuryo', rate: '3.42', minAmount: '15' })}
            fiat="USD"
            symbol="TON"
            direction="sell"
            image={mercuryoImageUrl}
            isLoading={false}
            isBest
            belowMin
            showSwitch
            onClick={noop}
        />
    ),
    undefined,
    { target: 'component', setupPage: setupImageMocks }
);

// No quote yet, mutation in flight — "Loading…" placeholder.
screenshotEachMode(
    'ProviderCard loading',
    () => (
        <ProviderCard
            quote={undefined}
            fiat="USD"
            symbol="TON"
            isLoading
            isBest={false}
            belowMin={false}
            showSwitch={false}
        />
    ),
    undefined,
    { target: 'component' }
);

// Empty amount field — hint placeholder.
screenshotEachMode(
    'ProviderCard hint',
    () => (
        <ProviderCard
            quote={undefined}
            fiat="USD"
            symbol="TON"
            isLoading={false}
            isBest={false}
            belowMin={false}
            showSwitch={false}
        />
    ),
    undefined,
    { target: 'component' }
);
