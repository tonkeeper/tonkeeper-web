import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';

import { expect, screenshotEachMode, test } from '../../../../playwright/test';
import {
    BackgroundElementsHarnessAsset,
    MultichainBackgroundElementsHarness
} from './MultichainBackgroundElementsHarness';

const USDT_JETTON = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';
const RECIPIENT = 'EQDtR_gykQ0K0W11a0I51m8G_aIC_epBTaLMO7L9aQPfOwzo';

const TON: BackgroundElementsHarnessAsset = {
    assetId: 'ton/mainnet/coin',
    chain: 'ton',
    name: 'Toncoin',
    symbol: 'TON',
    decimals: 9,
    image: '',
    balance: '33510000000',
    isHidden: false,
    verification: 'whitelist'
};

const TON_USDT: BackgroundElementsHarnessAsset = {
    assetId: `ton/mainnet/jetton/${USDT_JETTON}`,
    chain: 'ton',
    name: 'Tether USD',
    symbol: 'USD₮',
    decimals: 6,
    image: '',
    balance: '250000000',
    isHidden: false,
    verification: 'whitelist'
};

const TRON_USDT: BackgroundElementsHarnessAsset = {
    assetId: 'tron/mainnet/trc20/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    chain: 'tron',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    image: '',
    balance: '100000000',
    isHidden: false,
    verification: 'whitelist'
};

const TON_TRANSFER = {
    chain: BLOCKCHAIN_NAME.TON,
    from: 'qr-code',
    address: RECIPIENT,
    amount: '1500000000',
    text: 'Thanks!'
} as const;

// No amount → nothing denominates an asset, so nothing is pinned.
const TON_ADDRESS_ONLY = {
    chain: BLOCKCHAIN_NAME.TON,
    from: 'qr-code',
    address: RECIPIENT
} as const;

screenshotEachMode(
    'MultichainBackgroundElements prefilled from a TON link',
    () => <MultichainBackgroundElementsHarness assets={[TON, TON_USDT]} payload={TON_TRANSFER} />,
    ['desktop', 'mobile'],
    {
        target: 'dialog',
        interact: component => component.getByRole('button', { name: 'Emit transfer' }).click()
    }
);

test('an amount-bearing TON link prefills the native coin form', async ({ mount, page }) => {
    const c = await mount(
        <MultichainBackgroundElementsHarness
            assets={[TON, TON_USDT, TRON_USDT]}
            payload={TON_TRANSFER}
        />
    );
    await c.getByRole('button', { name: 'Emit transfer' }).click();

    // The nanoton amount denominates the native coin, so it is pinned and
    // the form opens prefilled — no picker.
    await expect(page.getByText('Choose asset')).toHaveCount(0);
    await expect(page.getByPlaceholder('Address or name')).toHaveValue(RECIPIENT);
    await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('1.5');
});

test('an address-only TON link opens the picker scoped to TON and seeds the recipient', async ({
    mount,
    page
}) => {
    const c = await mount(
        <MultichainBackgroundElementsHarness
            assets={[TON, TON_USDT, TRON_USDT]}
            payload={TON_ADDRESS_ONLY}
        />
    );
    await c.getByRole('button', { name: 'Emit transfer' }).click();

    // No asset pinned: the picker opens, scoped to the recipient's chain.
    await expect(page.getByText('Choose asset')).toBeVisible();
    await expect(page.getByRole('button', { name: /^USD₮/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^USDT/ })).toHaveCount(0);

    // Picking an asset lands on the form with the link's recipient; no
    // amount was ever given. (The name includes the balance — a bare
    // /^TON/ would also match the chain chip.)
    await page.getByRole('button', { name: /^TON 33/ }).click();
    await expect(page.getByPlaceholder('Address or name')).toHaveValue(RECIPIENT);
    await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('');
});

test('an asset the recipient cannot receive is dropped with its amount', async ({
    mount,
    page
}) => {
    const c = await mount(
        <MultichainBackgroundElementsHarness
            assets={[TON, TON_USDT, TRON_USDT]}
            // TRON Tether pinned, but the recipient is a TON address.
            payload={{
                assetId: TRON_USDT.assetId,
                from: 'qr-code',
                address: RECIPIENT,
                amount: '5000000'
            }}
        />
    );
    await c.getByRole('button', { name: 'Emit transfer' }).click();

    await expect(page.getByText('Choose asset')).toBeVisible();
    await expect(page.getByRole('button', { name: /^USDT/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^USD₮/ })).toBeVisible();
});

test('resolves a jetton link to that jetton with its own decimals', async ({ mount, page }) => {
    const c = await mount(
        <MultichainBackgroundElementsHarness
            assets={[TON, TON_USDT]}
            payload={{
                chain: BLOCKCHAIN_NAME.TON,
                from: 'qr-code',
                address: RECIPIENT,
                // Raw form of the same jetton master the wallet holds in
                // friendly form — matching is by address, not by string.
                jetton: '0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe',
                amount: '2500000'
            }}
        />
    );
    await c.getByRole('button', { name: 'Emit transfer' }).click();

    await expect(page.getByRole('textbox', { name: 'Amount' })).toHaveValue('2.5');
    await expect(page.getByRole('button', { name: 'USD₮' })).toBeVisible();
});

test('falls back to the asset picker with a toast when the wallet lacks the token', async ({
    mount,
    page
}) => {
    const c = await mount(
        <MultichainBackgroundElementsHarness
            assets={[TON]}
            payload={{
                chain: BLOCKCHAIN_NAME.TON,
                from: 'qr-code',
                address: RECIPIENT,
                jetton: USDT_JETTON
            }}
        />
    );
    await c.getByRole('button', { name: 'Emit transfer' }).click();

    await expect(page.getByText('Choose asset')).toBeVisible();
    await expect(
        c.getByText("That token isn't in your wallet. Choose what to send.")
    ).toBeVisible();
});

test('stays closed until a transfer intent arrives', async ({ mount, page }) => {
    await mount(<MultichainBackgroundElementsHarness assets={[TON]} payload={TON_TRANSFER} />);
    await expect(page.getByRole('dialog')).toHaveCount(0);
});
