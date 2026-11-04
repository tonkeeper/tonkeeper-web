import { MultichainActivity } from '@tonkeeper/core/dist/service/multichainActivityService';

import { expect, screenshot, test } from '../../../../../playwright/test';
import { MultichainHistoryGroup, MultichainHistoryView } from './MultichainHistoryView';

const noop = () => {};

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
const BTC = {
    assetId: 'btc/mainnet/coin',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
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

const AT = Date.parse('2024-09-04T17:32:00Z');

const swapTonBtc: MultichainActivity = {
    activityType: 'swap',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'ton',
    toChain: 'btc',
    direction: 'self',
    txIds: ['ton:0x1', 'btc:0x2'],
    outToken: TON,
    outAmount: '100000000000',
    inToken: BTC,
    inAmount: '28000000'
};

const sent: MultichainActivity = {
    activityType: 'send',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'eth',
    toChain: 'eth',
    direction: 'out',
    txIds: ['eth:0x3'],
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
    txIds: ['tron:0x4'],
    fromAddress: 'TJ1234567890abcdefghijklmnopqrstuv',
    inToken: USDT_TRON,
    inAmount: '735310000'
};

const swapDai: MultichainActivity = {
    activityType: 'swap',
    status: 'confirmed',
    blockTimeMs: AT,
    fromChain: 'base',
    toChain: 'bsc',
    direction: 'self',
    txIds: ['base:0x5', 'bsc:0x6'],
    outToken: DAI_BASE,
    outAmount: '1017000000000000000000',
    inToken: DAI_BSC,
    inAmount: '1017000000000000000000'
};

const groups: MultichainHistoryGroup[] = [
    ['today', [swapTonBtc]],
    ['yesterday', [sent, received, swapDai]]
];

const populated = {
    language: 'en',
    groups,
    isLoading: false,
    isEmpty: false,
    isError: false,
    onRetry: noop,
    hasFilter: false,
    showTypeFilter: true,
    isFetchingNextPage: false,
    onSelectChain: noop,
    onSelectTypeFilter: noop,
    onBack: noop,
    onAddFunds: noop,
    onSelectActivity: noop,
    onOpenFilters: noop
} as const;

screenshot('MultichainHistoryView desktop', () => (
    <div className="h-[720px] w-[520px] overflow-hidden">
        <MultichainHistoryView {...populated} compact />
    </div>
));

screenshot('MultichainHistoryView mobile', () => (
    <div className="h-[780px] w-[390px] overflow-hidden">
        <MultichainHistoryView {...populated} />
    </div>
));

screenshot('MultichainHistoryView empty', () => (
    <div className="h-[720px] w-[520px] overflow-hidden">
        <MultichainHistoryView {...populated} compact groups={[]} isEmpty showTypeFilter={false} />
    </div>
));

screenshot('MultichainHistoryView filtered empty', () => (
    <div className="h-[720px] w-[520px] overflow-hidden">
        <MultichainHistoryView {...populated} compact groups={[]} isEmpty hasFilter />
    </div>
));

screenshot('MultichainHistoryView error', () => (
    <div className="h-[720px] w-[520px] overflow-hidden">
        <MultichainHistoryView {...populated} compact groups={[]} isError showTypeFilter={false} />
    </div>
));

test('error state offers a retry', async ({ mount }) => {
    let retried = 0;
    const c = await mount(
        <div className="w-[520px]">
            <MultichainHistoryView
                {...populated}
                compact
                groups={[]}
                isError
                showTypeFilter={false}
                onRetry={() => (retried += 1)}
            />
        </div>
    );
    await c.getByRole('button', { name: 'Try Again' }).click();
    expect(retried).toBe(1);
});

test('a failed later page keeps the rows and offers a footer retry', async ({ mount }) => {
    let retried = 0;
    const c = await mount(
        <div className="w-[520px]">
            <MultichainHistoryView
                {...populated}
                compact
                isLoadMoreError
                onRetryLoadMore={() => (retried += 1)}
            />
        </div>
    );
    await expect(c.getByText('Received', { exact: true })).toBeVisible();
    await expect(c.getByText('Couldn’t load more')).toBeVisible();
    await c.getByRole('button', { name: 'Retry' }).click();
    expect(retried).toBe(1);
});

test('renders the date-group titles and rows', async ({ mount }) => {
    const c = await mount(
        <div className="w-[520px]">
            <MultichainHistoryView {...populated} compact />
        </div>
    );
    await expect(c.getByText('Today', { exact: true })).toBeVisible();
    await expect(c.getByText('Yesterday', { exact: true })).toBeVisible();
    await expect(c.getByText('Received', { exact: true })).toBeVisible();
});

test('tapping a row reports the picked activity', async ({ mount }) => {
    let picked: MultichainActivity | undefined;
    const c = await mount(
        <div className="w-[520px]">
            <MultichainHistoryView {...populated} compact onSelectActivity={a => (picked = a)} />
        </div>
    );
    await c.getByText('Received', { exact: true }).click();
    expect(picked?.activityType).toBe('receive');
});
