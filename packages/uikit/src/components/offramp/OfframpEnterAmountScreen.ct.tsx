import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { expect, screenshotEachMode, test } from '../../../playwright/test';
import { OfframpEnterAmountScreen } from './OfframpEnterAmountScreen';

const noop = () => {};

const ASSET: MultichainWalletAsset = {
    assetId: 'ton/mainnet/coin',
    chain: 'ton',
    name: 'Toncoin',
    symbol: 'TON',
    decimals: 9,
    image: '',
    balance: '12500000000',
    verification: 'whitelist',
    isHidden: false
};

// Fresh screen: empty crypto input, fiat pill at zero, balance line, MAX,
// quote hint in the provider slot and a disabled Continue.
screenshotEachMode(
    'OfframpEnterAmountScreen empty',
    () => (
        <OfframpEnterAmountScreen
            isOpen
            onClose={noop}
            onBack={noop}
            onContinue={noop}
            asset={ASSET}
            fiat="USD"
            payoutMethod="card"
        />
    ),
    undefined,
    { target: 'dialog' }
);

test('OfframpEnterAmountScreen MAX fills the wallet balance', async ({ mount, page }) => {
    await mount(
        <OfframpEnterAmountScreen
            isOpen
            onClose={noop}
            onContinue={noop}
            asset={ASSET}
            fiat="USD"
            payoutMethod="card"
        />
    );
    await page.getByText('MAX').click();
    await expect(page.getByLabel('amount')).toHaveValue('12.5');
});

test('OfframpEnterAmountScreen flags an amount above the balance', async ({ mount, page }) => {
    await mount(
        <OfframpEnterAmountScreen
            isOpen
            onClose={noop}
            onContinue={noop}
            asset={ASSET}
            fiat="USD"
            payoutMethod="card"
        />
    );
    await page.getByLabel('amount').fill('20');
    await expect(page.getByText('Insufficient balance')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
});
