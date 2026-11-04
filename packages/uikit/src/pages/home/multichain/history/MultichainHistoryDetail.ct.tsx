import { MultichainActivity } from '@tonkeeper/core/dist/service/multichainActivityService';

import { expect, screenshotEachMode, test } from '../../../../../playwright/test';
import { MultichainHistoryDetail } from './MultichainHistoryDetail';

const noop = () => {};

const SHIB = {
    assetId: 'eth/mainnet/erc20/0xshib',
    name: 'Shiba Inu',
    symbol: 'SHIB',
    decimals: 18,
    image: '',
    verification: 'whitelist' as const
};
const TON = {
    assetId: 'ton/mainnet/coin',
    name: 'Toncoin',
    symbol: 'TON',
    decimals: 9,
    image: '',
    verification: 'whitelist' as const
};
const ETH = {
    assetId: 'eth/mainnet/coin',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    image: '',
    verification: 'whitelist' as const
};

const AT = Date.parse('2024-09-04T17:32:00Z');

// A comment is only carried by comment-capable chains (TON); EVM transfers
// have none, so the ETH fixtures deliberately omit `meta.comment`.
const sent: MultichainActivity = {
    activityType: 'send',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'eth',
    toChain: 'eth',
    direction: 'out',
    txIds: ['eth:0xdeadbeefcafe'],
    explorerUrl: 'https://eth.blockscout.com/tx/0xdeadbeefcafe',
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    outToken: SHIB,
    outAmount: '1016000000000000000000',
    outAmountUsd: 10.81,
    feeToken: ETH,
    feeAmount: '740000000000000',
    feeAmountUsd: 0.03
};

const pending: MultichainActivity = { ...sent, status: 'pending' };
const failed: MultichainActivity = { ...sent, status: 'failed' };

const received: MultichainActivity = {
    activityType: 'receive',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'eth',
    toChain: 'eth',
    direction: 'in',
    txIds: ['eth:0xfeedface'],
    explorerUrl: 'https://eth.blockscout.com/tx/0xfeedface',
    fromAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    inToken: SHIB,
    inAmount: '1016000000000000000000',
    inAmountUsd: 10.81
};

// TON is comment-capable, so this transfer carries a `meta.comment` that the
// detail renders as the "Comment" row.
const tonSent: MultichainActivity = {
    activityType: 'send',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'ton',
    toChain: 'ton',
    direction: 'out',
    txIds: ['ton:0x9'],
    explorerUrl: 'https://tonviewer.com/transaction/0x9',
    toAddress: '0:83dfd552e63729b472fcbcc8c45ebcc6691702558b68ec7527e1ba403a0f31a8',
    outToken: TON,
    outAmount: '400310000000',
    outAmountUsd: 1200.93,
    feeToken: TON,
    feeAmount: '5000000',
    feeAmountUsd: 0.01,
    meta: { comment: 'Thanks!' }
};

const DAI_BASE = {
    assetId: 'base/mainnet/erc20/0xdai',
    name: 'Dai',
    symbol: 'DAI',
    decimals: 18,
    image: '',
    verification: 'whitelist' as const
};
const DAI_BSC = {
    assetId: 'bsc/mainnet/bep20/0xdai',
    name: 'Dai',
    symbol: 'DAI',
    decimals: 18,
    image: '',
    verification: 'whitelist' as const
};
const swap: MultichainActivity = {
    activityType: 'swap',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'base',
    toChain: 'bsc',
    direction: 'self',
    txIds: ['base:0x5', 'bsc:0x6'],
    explorerUrl: 'https://base.blockscout.com/tx/0x5',
    outToken: DAI_BASE,
    outAmount: '1017000000000000000000',
    outAmountUsd: 1017,
    inToken: DAI_BSC,
    inAmount: '1017000000000000000000',
    inAmountUsd: 1017
};

// The transaction-detail card renders differently per breakpoint (desktop =
// centered dialog, mobile = bottom sheet), so screenshot the `role="dialog"`
// card in both. `target: 'dialog'` snapshots just the card, waiting out the
// modal's fade-in.
screenshotEachMode(
    'MultichainHistoryDetail received',
    () => <MultichainHistoryDetail activity={received} isOpen onClose={noop} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'MultichainHistoryDetail swap',
    () => <MultichainHistoryDetail activity={swap} isOpen onClose={noop} />,
    ['desktop', 'mobile'],
    { target: 'dialog' }
);

screenshotEachMode(
    'MultichainHistoryDetail sent',
    () => <MultichainHistoryDetail activity={sent} isOpen onClose={noop} />,
    ['desktop'],
    { target: 'dialog' }
);

screenshotEachMode(
    'MultichainHistoryDetail failed',
    () => <MultichainHistoryDetail activity={failed} isOpen onClose={noop} />,
    ['desktop'],
    { target: 'dialog' }
);

screenshotEachMode(
    'MultichainHistoryDetail pending',
    () => <MultichainHistoryDetail activity={pending} isOpen onClose={noop} />,
    ['desktop'],
    { target: 'dialog' }
);

screenshotEachMode(
    'MultichainHistoryDetail ton comment',
    () => <MultichainHistoryDetail activity={tonSent} isOpen onClose={noop} />,
    ['desktop'],
    { target: 'dialog' }
);

test('shows the recipient, network, fee and explorer link', async ({ mount, page }) => {
    await mount(<MultichainHistoryDetail activity={sent} isOpen onClose={noop} />);
    await expect(page.getByText('SHIB').first()).toBeVisible();
    await expect(page.getByText('Sent on', { exact: false })).toBeVisible();
    await expect(page.getByText('Network', { exact: true })).toBeVisible();
    await expect(page.getByText('ERC20')).toBeVisible();
    const explorerButton = page.getByRole('button', { name: /Transaction/ });
    await expect(explorerButton).toBeVisible();
    await expect(explorerButton.locator('svg')).toBeVisible();
    await expect(explorerButton.locator('.text-textTertiary')).toHaveText('0xdead…cafe');
});

test('received shows the sender address and network', async ({ mount, page }) => {
    await mount(<MultichainHistoryDetail activity={received} isOpen onClose={noop} />);
    await expect(page.getByText('Received on', { exact: false })).toBeVisible();
    await expect(page.getByText('Sender address')).toBeVisible();
    await expect(page.getByText('ERC20')).toBeVisible();
});

test('an EVM transfer has no comment row', async ({ mount, page }) => {
    await mount(<MultichainHistoryDetail activity={sent} isOpen onClose={noop} />);
    await expect(page.getByText('Comment')).toHaveCount(0);
});

test('a TON transfer shows the comment', async ({ mount, page }) => {
    await mount(<MultichainHistoryDetail activity={tonSent} isOpen onClose={noop} />);
    await expect(page.getByText('Comment')).toBeVisible();
    await expect(page.getByText('Thanks!')).toBeVisible();
});

test('swap shows both legs and their networks', async ({ mount, page }) => {
    await mount(<MultichainHistoryDetail activity={swap} isOpen onClose={noop} />);
    await expect(page.getByText('Swapped on', { exact: false })).toBeVisible();
    await expect(page.getByText('Base → BNB Smart Chain')).toBeVisible();
});

test('pending shows the status without a cancel affordance', async ({ mount, page }) => {
    await mount(<MultichainHistoryDetail activity={pending} isOpen onClose={noop} />);
    await expect(page.getByText('Pending')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toHaveCount(0);
});

// MockAppSdk.copyToClipboard logs the copied value via console.debug, which
// is the observable side effect available under ct.
type Page = Parameters<Parameters<typeof test>[2]>[0]['page'];

const collectDebug = (page: Page): string[] => {
    const messages: string[] = [];
    page.on('console', message => {
        if (message.type() === 'debug') messages.push(message.text());
    });
    return messages;
};

test('clicking the address copies the full address and toasts', async ({ mount, page }) => {
    const debugMessages = collectDebug(page);
    await mount(<MultichainHistoryDetail activity={sent} isOpen onClose={noop} />);
    await page.getByRole('button', { name: /Recipient address/ }).click();
    await expect
        .poll(() =>
            debugMessages.some(
                m =>
                    m.includes('0x1234567890abcdef1234567890abcdef12345678') && m.includes('Copied')
            )
        )
        .toBe(true);
});

test('clicking the hash copies it instead of opening the explorer', async ({ mount, page }) => {
    const debugMessages = collectDebug(page);
    await mount(<MultichainHistoryDetail activity={sent} isOpen onClose={noop} />);
    await page.getByText('0xdead…cafe').click();
    await expect
        .poll(() => debugMessages.some(m => m.includes('0xdeadbeefcafe') && m.includes('Copied')))
        .toBe(true);
    expect(debugMessages.some(m => m.includes('blockscout'))).toBe(false);
});
