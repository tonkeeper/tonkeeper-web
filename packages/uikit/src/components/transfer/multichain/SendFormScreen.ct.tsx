import { expect, screenshotEachMode, test } from '../../../../playwright/test';
import { SendFormHarnessAsset, SendFormScreenHarness } from './SendFormScreenHarness';

const noop = () => {};

const TON: SendFormHarnessAsset = {
    assetId: 'ton/mainnet/coin',
    chain: 'ton',
    name: 'Toncoin',
    symbol: 'TON',
    decimals: 9,
    image: '',
    balance: '33510000000',
    verification: 'whitelist',
    isHidden: false,
    priceStr: '1.57'
};

// An EVM ERC-20 — carries a chain badge on the token pill and, being non-TON,
// hides the comment field.
const USDT_ETH: SendFormHarnessAsset = {
    assetId: 'eth/mainnet/erc20/0xdac17f958d2ee523a2206206994597c13d831ec7',
    chain: 'evm',
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    image: '',
    balance: '250000000',
    verification: 'whitelist',
    isHidden: false,
    priceStr: '1'
};

// Full-screen flow modal — the body is portaled, so screenshot the dialog and
// capture both breakpoints (the modal card sizes to the viewport).
screenshotEachMode(
    'SendForm TON coin',
    () => (
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'SendForm EVM token',
    () => (
        <SendFormScreenHarness
            isOpen
            asset={USDT_ETH}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'SendForm prefilled',
    () => (
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
            initial={{
                toAddress: 'EQDtR_gykQ0K0W11a0I51m8G_aIC_epBTaLMO7L9aQPfOwzo',
                amountDisplay: '1.5',
                comment: 'Thanks!'
            }}
        />
    ),
    ['desktop', 'mobile'],
    {
        target: 'dialog',
        // The TON recipient resolves through tonapi; block it so the form
        // renders the deterministic pre-resolution state.
        setupPage: async page => {
            await page.route('https://tonapi.io/**', route => route.abort());
        }
    }
);

// Over-balance amount: the field turns red, the fiat line gives way to the
// error, and the long fiat/balance row must stay on one line.
screenshotEachMode(
    'SendForm insufficient balance',
    () => (
        <SendFormScreenHarness
            isOpen
            asset={USDT_ETH}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
            initial={{ amountDisplay: '0101010101010101272727272727272727272' }}
        />
    ),
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

test('SendForm flags an amount above balance and keeps Continue disabled', async ({
    mount,
    page
}) => {
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={USDT_ETH}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    const amount = page.getByRole('textbox', { name: 'Amount' });
    await amount.fill('251');
    await expect(page.getByText('Insufficient balance')).toBeVisible();
    await expect(page.getByText('Balance: 250 USDT')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
    await amount.fill('250');
    await expect(page.getByText('Insufficient balance')).toHaveCount(0);
});

test('SendForm renders the address + amount fields and disables Continue until filled', async ({
    mount,
    page
}) => {
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    await expect(page.getByPlaceholder('Address or name')).toBeVisible();
    await expect(page.getByText('Amount')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
});

test('SendForm shows the comment field for TON', async ({ mount, page }) => {
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    await expect(page.getByText('Comment')).toBeVisible();
});

test('SendForm omits the comment field for a non-TON asset', async ({ mount, page }) => {
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={USDT_ETH}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    await expect(page.getByPlaceholder('Address or name')).toBeVisible();
    await expect(page.getByText('Comment')).toHaveCount(0);
});

const RAW_RECIPIENT = '0:ed47f832910d0ad16d756b4239d66f06fda202fdea414da2cc3bb2fd6903df3b';

const tonapiAccount = (overrides: Record<string, unknown> = {}) => ({
    address: RAW_RECIPIENT,
    balance: 1000000000,
    last_activity: 0,
    status: 'active',
    get_methods: [],
    is_wallet: true,
    ...overrides
});

test('SendForm blocks a scam TON recipient', async ({ mount, page }) => {
    await page.route('https://tonapi.io/v2/accounts/**', route =>
        route.fulfill({ json: tonapiAccount({ is_scam: true }) })
    );
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    await page
        .getByPlaceholder('Address or name')
        .fill('EQDtR_gykQ0K0W11a0I51m8G_aIC_epBTaLMO7L9aQPfOwzo');
    await page.getByRole('textbox', { name: 'Amount' }).fill('1');
    await expect(page.getByText('Transfers to this address are not supported.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
});

test('SendForm resolves a .ton name and enables Continue', async ({ mount, page }) => {
    await page.route('https://tonapi.io/v2/dns/**', route =>
        route.fulfill({
            json: {
                wallet: {
                    address: RAW_RECIPIENT,
                    is_wallet: true,
                    has_method_pubkey: false,
                    has_method_seqno: false,
                    names: []
                }
            }
        })
    );
    await page.route('https://tonapi.io/v2/accounts/**', route =>
        route.fulfill({ json: tonapiAccount() })
    );
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    await page.getByPlaceholder('Address or name').fill('foo.ton');
    await page.getByRole('textbox', { name: 'Amount' }).fill('1');
    await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled();
});

test('SendForm reports an unknown .ton name as not found', async ({ mount, page }) => {
    await page.route('https://tonapi.io/v2/dns/**', route =>
        route.fulfill({ status: 404, json: { error: "not resolved: can't unmarshal null" } })
    );
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    await page.getByPlaceholder('Address or name').fill('foundadtion.ton');
    await page.getByPlaceholder('Address or name').blur();
    await expect(page.getByText('Domain not found. Check the name and try again.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeDisabled();
});

test('SendForm caps the amount at the asset precision', async ({ mount, page }) => {
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={USDT_ETH}
            onClose={noop}
            onChangeToken={noop}
            onContinue={noop}
        />
    );
    const amount = page.getByRole('textbox', { name: 'Amount' });
    // USDT has 6 decimals: the seventh fraction digit is dropped.
    await amount.pressSequentially('1.1234567');
    await expect(amount).toHaveValue('1.123456');
});

test('SendForm token pill opens the asset switcher', async ({ mount, page }) => {
    let changed = 0;
    await mount(
        <SendFormScreenHarness
            isOpen
            asset={TON}
            onClose={noop}
            onChangeToken={() => (changed += 1)}
            onContinue={noop}
        />
    );
    await page.getByRole('button', { name: 'TON' }).click();
    expect(changed).toBe(1);
});
