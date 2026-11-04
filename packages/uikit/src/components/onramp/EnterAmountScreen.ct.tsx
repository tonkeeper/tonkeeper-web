import { EnterAmountScreen } from './EnterAmountScreen';
import { EnterAmountScreenWithSwapsHarness } from './EnterAmountScreenHarness';
import { expect, screenshotEachMode, test } from '../../../playwright/test';

const noop = () => {};

screenshotEachMode(
    'EnterAmountScreen empty',
    () => (
        <EnterAmountScreen
            isOpen
            onClose={noop}
            onBack={noop}
            onContinue={noop}
            asset={{ assetId: 'ton/mainnet/coin', symbol: 'TON' }}
            fiat="USD"
            paymentMethod="card"
        />
    ),
    undefined,
    { target: 'dialog' }
);

test('EnterAmountScreen back arrow fires onBack', async ({ mount, page }) => {
    let backs = 0;
    await mount(
        <EnterAmountScreen
            isOpen
            onClose={noop}
            onBack={() => backs++}
            onContinue={noop}
            asset={{ assetId: 'ton/mainnet/coin', symbol: 'TON' }}
            fiat="USD"
            paymentMethod="card"
        />
    );
    await page.getByRole('button', { name: 'Back' }).click();
    expect(backs).toBe(1);
});

test('EnterAmountScreen hides the equivalent below the minimum', async ({ mount, page }) => {
    const belowMin = {
        merchant: 'moonpay',
        paymentMethod: 'card',
        amountIn: '1',
        amountOut: '0',
        rate: '0',
        fees: {},
        minAmount: '25',
        dateExpire: '2030-01-01T00:00:00Z',
        merchantTransactionId: 'tx'
    };
    await page.route(/\/v2\/onramp\/quote/, route =>
        route.fulfill({ json: { items: [], suggested: [belowMin] } })
    );
    await mount(
        <EnterAmountScreenWithSwapsHarness
            isOpen
            onClose={noop}
            onContinue={noop}
            asset={{ assetId: 'eth/mainnet/coin', symbol: 'ETH' }}
            fiat="USD"
            paymentMethod="card"
            initialAmount="1"
        />
    );
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText(/25 USD/)).toBeVisible();
    await expect(dialog.getByText('0 ETH')).toBeHidden();
});
