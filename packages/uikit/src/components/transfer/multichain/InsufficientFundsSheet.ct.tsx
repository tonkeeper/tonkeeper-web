import { expect, screenshotEachMode, test } from '../../../../playwright/test';
import { InsufficientFundsSheet } from './InsufficientFundsSheet';

const noop = () => {};

screenshotEachMode(
    'InsufficientFundsSheet',
    () => (
        <InsufficientFundsSheet
            isOpen
            onClose={noop}
            required="10.55 TON"
            balance="2.3 TON"
            buySymbol="TON"
            onBuy={noop}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('names the shortfall and fires onBuy', async ({ mount, page }) => {
    let bought = 0;
    await mount(
        <InsufficientFundsSheet
            isOpen
            onClose={noop}
            required="10.55 TON"
            balance="2.3 TON"
            buySymbol="TON"
            onBuy={() => (bought += 1)}
        />
    );
    await expect(page.getByText('Insufficient Funds')).toBeVisible();
    await expect(page.getByText('To be paid: 10.55 TON')).toBeVisible();
    await expect(page.getByText('Your balance: 2.3 TON')).toBeVisible();
    await page.getByRole('button', { name: 'Buy TON' }).click();
    expect(bought).toBe(1);
});
