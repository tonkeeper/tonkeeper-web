import { MultichainActivity } from '@tonkeeper/core/dist/service/multichainActivityService';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainHistoryRow } from './MultichainHistoryRow';

const SHIB = {
    assetId: 'eth/mainnet/erc20/0xshib',
    name: 'Shiba Inu',
    symbol: 'SHIB',
    decimals: 18,
    image: '',
    verification: 'whitelist' as const
};
const USDT_TRON = {
    assetId: 'tron/mainnet/trc20/0xusdt',
    name: 'Tether',
    symbol: 'USD₮',
    decimals: 6,
    image: '',
    verification: 'whitelist' as const
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

const AT = Date.parse('2024-09-04T17:32:00Z');

const sent: MultichainActivity = {
    activityType: 'send',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'eth',
    toChain: 'eth',
    direction: 'out',
    txIds: ['eth:0xa'],
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    outToken: SHIB,
    outAmount: '1016000000000000000000'
};

const received: MultichainActivity = {
    activityType: 'receive',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'tron',
    toChain: 'tron',
    direction: 'in',
    txIds: ['tron:0xb'],
    fromAddress: 'TJ1234567890abcdefghijklmnopqrstuv',
    inToken: USDT_TRON,
    inAmount: '735310000'
};

const swap: MultichainActivity = {
    activityType: 'swap',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'base',
    toChain: 'bsc',
    direction: 'self',
    txIds: ['base:0xc', 'bsc:0xd'],
    toAddress: '0x1234567890abcdef1234567890abcdef12345678',
    outToken: DAI_BASE,
    outAmount: '1017000000000000000000',
    inToken: DAI_BSC,
    inAmount: '1017000000000000000000'
};

const failed: MultichainActivity = { ...sent, status: 'failed' };
const pending: MultichainActivity = { ...sent, status: 'pending' };

const TON = {
    assetId: 'ton/mainnet/coin',
    name: 'Toncoin',
    symbol: 'TON',
    decimals: 9,
    image: '',
    verification: 'whitelist' as const
};

const stake: MultichainActivity = {
    activityType: 'stake',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'ton',
    toChain: 'ton',
    direction: 'out',
    txIds: ['ton:0xe'],
    toAddress: '0:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    protocol: 'liquidTF',
    outToken: TON,
    outAmount: '10000000000'
};

const dnsRenew: MultichainActivity = {
    activityType: 'dns_renew',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'ton',
    toChain: 'ton',
    direction: 'out',
    txIds: ['ton:0x10'],
    toAddress: '0:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    outToken: TON,
    outAmount: '5000000'
};

const NFT_ADDRESS = '0:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const nftReceived: MultichainActivity = {
    activityType: 'receive',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'ton',
    toChain: 'ton',
    direction: 'in',
    txIds: ['ton:0xf'],
    fromAddress: '0:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc',
    inToken: {
        assetId: `ton/mainnet/nft/${NFT_ADDRESS}`,
        name: 'NFT',
        symbol: 'NFT',
        decimals: 0,
        image: '',
        verification: 'whitelist' as const
    },
    inAmount: '1'
};

const spam: MultichainActivity = { ...received, isSpam: true };

const withComment: MultichainActivity = {
    ...received,
    fromChain: 'ton',
    toChain: 'ton',
    txIds: ['ton:0xc'],
    fromAddress: 'UQAbCdEfGhIjKlMnOpQrStUvWxYz0123456789AbCdEfGhIjKlMn',
    inToken: TON,
    inAmount: '2500000000',
    meta: { comment: 'Thanks for dinner! Splitting the bill as promised.' }
};
const spamWithComment: MultichainActivity = { ...withComment, isSpam: true };

const CARD = 'w-[360px] overflow-hidden rounded-medium bg-backgroundPage';

screenshot('MultichainHistoryRow sent', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={sent} />
    </div>
));

screenshot('MultichainHistoryRow received', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={received} />
    </div>
));

screenshot('MultichainHistoryRow swap two amounts', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={swap} />
    </div>
));

screenshot('MultichainHistoryRow failed shows status', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={failed} />
    </div>
));

screenshot('MultichainHistoryRow spam shows the label', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={spam} />
    </div>
));

screenshot('MultichainHistoryRow comment bubble', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={withComment} />
    </div>
));

screenshot('MultichainHistoryRow pending shows spinner', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={pending} />
    </div>
));

screenshot('MultichainHistoryRow domain renew shows the update icon', () => (
    <div className={CARD}>
        <MultichainHistoryRow activity={dnsRenew} />
    </div>
));

screenshot('MultichainHistoryRow grouped rows share one card', () => (
    <div className={CARD}>
        <div className="overflow-hidden rounded-medium bg-backgroundContent">
            <MultichainHistoryRow activity={sent} grouped />
            <div className="border-t border-separatorCommon">
                <MultichainHistoryRow activity={received} grouped />
            </div>
        </div>
    </div>
));

test('renders the amount, symbol and chain badge', async ({ mount }) => {
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={sent} />
        </div>
    );
    await expect(c).toContainText('016');
    await expect(c).toContainText('SHIB');
    await expect(c).toContainText('ETH');
});

test('shows the transfer comment under the amount', async ({ mount }) => {
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={withComment} />
        </div>
    );
    await expect(c).toContainText('Thanks for dinner!');
});

test('pending transfer is titled in the progressive form', async ({ mount }) => {
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={pending} />
        </div>
    );
    await expect(c).toContainText('Sending');
    await expect(c).not.toContainText('Sent');
});

test('hides the comment on spam transfers', async ({ mount }) => {
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={spamWithComment} />
        </div>
    );
    await expect(c).not.toContainText('Thanks for dinner!');
});

test('swap renders both the incoming and outgoing amounts', async ({ mount }) => {
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={swap} />
        </div>
    );
    await expect(c).toContainText('BSC');
    await expect(c).toContainText('BASE');
});

test('stake renders the provider branding and GRAM symbol', async ({ mount }) => {
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={stake} />
        </div>
    );
    await expect(c).toContainText('Stake');
    await expect(c).toContainText('Tonstakers');
    await expect(c).toContainText('GRAM');
    await expect(c).not.toContainText('TON Whales');
});

test('received NFT resolves through tonapi into a preview card', async ({ mount, page }) => {
    await page.route('https://tonapi.io/v2/nfts/**', route =>
        route.fulfill({
            json: {
                address: NFT_ADDRESS,
                index: 1,
                verified: true,
                metadata: { name: 'Lost Dogs #4' },
                collection: { address: '0:dd', name: 'Lost Dogs', description: '' },
                approved_by: [],
                trust: 'whitelist'
            }
        })
    );
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={nftReceived} />
        </div>
    );
    await expect(c).toContainText('Lost Dogs #4');
    await expect(c).toContainText('Lost Dogs');
    await expect(c).not.toContainText('+ 1 NFT');
});

test('domain renew resolves the renewed .ton item through tonapi', async ({ mount, page }) => {
    await page.route('https://tonapi.io/v2/nfts/**', route =>
        route.fulfill({
            json: {
                address: dnsRenew.toAddress,
                index: 1,
                verified: true,
                metadata: { name: 'gram-is-love.ton' },
                dns: 'gram-is-love.ton',
                collection: { address: '0:ee', name: 'TON DNS Domains', description: '' },
                approved_by: [],
                trust: 'whitelist'
            }
        })
    );
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={dnsRenew} />
        </div>
    );
    await expect(c).toContainText('gram-is-love.ton');
    await expect(c).toContainText('TON DNS Domains');
});

test('fires onClick when tapped', async ({ mount }) => {
    let clicked = 0;
    const c = await mount(
        <div className={CARD}>
            <MultichainHistoryRow activity={sent} onClick={() => (clicked += 1)} />
        </div>
    );
    await c.getByRole('button').click();
    expect(clicked).toBe(1);
});
