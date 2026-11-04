/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

import {
    explorerLinkForActivity,
    formatMultichainAddress,
    getMultichainWalletActivities,
    isMultichainChain,
    MultichainActivity,
    parseTxId,
    reportMultichainPendingTransaction,
    shortenMultichainAddress
} from '../multichainActivityService';

function makeFetch(status: number, body: unknown): typeof fetch {
    return vi.fn(async () => {
        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: 'STATUS',
            json: async () => body
        } as Response;
    }) as unknown as typeof fetch;
}

const sendActivity = {
    activity_type: 'send',
    status: 'confirmed',
    block_time: '2024-09-04T17:32:00Z',
    from_chain: 'eth',
    to_chain: 'eth',
    direction: 'out',
    tx_ids: ['eth:0xdeadbeef'],
    from_address: '0xsender',
    to_address: '0xrecipient',
    from: { address: '0xsender' },
    to: { address: '0xrecipient', name: 'alice.ton' },
    out_token: {
        asset_id: 'eth/mainnet/erc20/0xshib',
        name: 'Shiba Inu',
        symbol: 'SHIB',
        decimals: 18,
        image: 'https://example/shib.png'
    },
    out_amount: '1016000000000000000000',
    out_amount_usd: 10.81,
    fee_token: {
        asset_id: 'ton/mainnet/coin',
        name: 'Toncoin',
        symbol: 'TON',
        decimals: 9,
        image: ''
    },
    fee_amount: '7400000',
    fee_amount_usd: 0.03,
    protocol: null
};

const swapActivity = {
    activity_type: 'swap',
    status: 'confirmed',
    block_time: '2024-09-04T17:32:00Z',
    from_chain: 'base',
    to_chain: 'arb',
    direction: 'self',
    tx_ids: ['base:0xaaa', 'arb:0xbbb'],
    out_token: {
        asset_id: 'base/mainnet/erc20/0xdai',
        name: 'Dai',
        symbol: 'DAI',
        decimals: 18,
        image: ''
    },
    out_amount: '1017000000000000000000',
    in_token: {
        asset_id: 'arb/mainnet/erc20/0xdai',
        name: 'Dai',
        symbol: 'DAI',
        decimals: 18,
        image: ''
    },
    in_amount: '1017000000000000000000',
    protocol: 'stargate'
};

describe('getMultichainWalletActivities', () => {
    it('normalizes the raw response, including nested tokens and missing optional fields', async () => {
        const fetchImpl = makeFetch(200, {
            activities: [sendActivity, swapActivity],
            next_cursor: 'page-2'
        });

        const res = await getMultichainWalletActivities({ walletId: 'w1', fetchImpl });

        expect(res.nextCursor).toBe('page-2');
        expect(res.activities).toHaveLength(2);

        const send = res.activities[0];
        expect(send).toMatchObject({
            activityType: 'send',
            status: 'confirmed',
            fromChain: 'eth',
            toChain: 'eth',
            direction: 'out',
            outAmount: '1016000000000000000000',
            outAmountUsd: 10.81,
            feeAmount: '7400000'
        });
        expect(send.blockTimeMs).toBe(Date.parse('2024-09-04T17:32:00Z'));
        expect(send.outToken).toMatchObject({ symbol: 'SHIB', decimals: 18 });
        expect(send.inToken).toBeUndefined();
        expect(send.toName).toBe('alice.ton');
        expect(send.fromName).toBeUndefined();
        // The generated client's FromJSON normalizes an absent/`null` optional to `undefined`.
        expect(send.protocol).toBeUndefined();

        const swap = res.activities[1];
        expect(swap.outToken?.symbol).toBe('DAI');
        expect(swap.inToken?.symbol).toBe('DAI');
        expect(swap.feeToken).toBeUndefined();
    });

    it('coerces an unparseable block_time to 0 and defaults missing arrays', async () => {
        const fetchImpl = makeFetch(200, {
            activities: [{ ...sendActivity, block_time: 'not-a-date', tx_ids: undefined }]
        });
        const res = await getMultichainWalletActivities({ walletId: 'w1', fetchImpl });
        expect(res.activities[0].blockTimeMs).toBe(0);
        expect(res.activities[0].txIds).toEqual([]);
        expect(res.nextCursor).toBe('');
    });

    it('builds the URL with wallet id, chain, activity_type, limit and cursor', async () => {
        const fetchImpl = makeFetch(200, { activities: [], next_cursor: '' });
        await getMultichainWalletActivities({
            walletId: 'wallet/xyz',
            chain: 'tron',
            activityType: 'receive',
            limit: 30,
            cursor: 'c-9',
            fetchImpl
        });
        const url = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toContain('/wallets/wallet%2Fxyz/activities?');
        expect(url).toContain('chain=tron');
        expect(url).toContain('activity_type=receive');
        expect(url).toContain('limit=30');
        expect(url).toContain('cursor=c-9');
    });

    it('omits the query string entirely when no filters are given', async () => {
        const fetchImpl = makeFetch(200, { activities: [], next_cursor: '' });
        await getMultichainWalletActivities({ walletId: 'w1', fetchImpl });
        const url = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(url).toMatch(/\/wallets\/w1\/activities$/);
    });

    it('passes the spam classification filter through in both directions', async () => {
        const fetchImpl = makeFetch(200, { activities: [], next_cursor: '' });
        await getMultichainWalletActivities({ walletId: 'w1', isSpam: true, fetchImpl });
        await getMultichainWalletActivities({ walletId: 'w1', isSpam: false, fetchImpl });
        await getMultichainWalletActivities({ walletId: 'w1', fetchImpl });
        const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
        expect(calls[0][0]).toContain('is_spam=true');
        expect(calls[1][0]).toContain('is_spam=false');
        expect(calls[2][0] as string).not.toContain('is_spam');
    });

    it('sends hide_dust only when the filter is on', async () => {
        const fetchImpl = makeFetch(200, { activities: [], next_cursor: '' });
        await getMultichainWalletActivities({ walletId: 'w1', hideDust: true, fetchImpl });
        await getMultichainWalletActivities({ walletId: 'w1', hideDust: false, fetchImpl });
        const calls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls;
        expect(calls[0][0]).toContain('hide_dust=true');
        // `false` is the backend default and travels as omission.
        expect(calls[1][0] as string).not.toContain('hide_dust');
    });

    it('throws on a non-2xx response', async () => {
        const fetchImpl = makeFetch(500, {});
        // The generated client raises a ResponseError on any non-2xx status.
        await expect(
            getMultichainWalletActivities({ walletId: 'w1', fetchImpl })
        ).rejects.toThrow();
    });
});

describe('parseTxId', () => {
    it('splits on the first colon only', () => {
        expect(parseTxId('eth:0xabc')).toEqual({ chain: 'eth', hash: '0xabc' });
        expect(parseTxId('ton:hash:with:colons')).toEqual({
            chain: 'ton',
            hash: 'hash:with:colons'
        });
    });

    it('treats a colon-less value as a bare hash', () => {
        expect(parseTxId('0xabc')).toEqual({ chain: '', hash: '0xabc' });
    });
});

describe('explorerLinkForActivity', () => {
    const base = {
        activityType: 'send',
        status: 'confirmed',
        blockTimeMs: 0,
        direction: 'out',
        fromChain: 'eth',
        toChain: 'eth',
        txIds: ['eth:0xdeadbeef'],
        explorerUrl: 'https://eth.blockscout.com/tx/0xdeadbeef'
    } as unknown as MultichainActivity;

    it('opens the backend explorer URL and labels it with the matching tx id', () => {
        expect(explorerLinkForActivity(base)).toMatchObject({
            url: 'https://eth.blockscout.com/tx/0xdeadbeef',
            hash: '0xdeadbeef'
        });
    });

    it('never composes an explorer URL from the hash', () => {
        expect(explorerLinkForActivity({ ...base, explorerUrl: undefined })).toBeUndefined();
        expect(explorerLinkForActivity({ ...base, explorerUrl: '  ' })).toBeUndefined();
    });

    it('ignores a non-web explorer URL', () => {
        expect(
            explorerLinkForActivity({ ...base, explorerUrl: 'javascript:alert(1)' })
        ).toBeUndefined();
    });

    it('abbreviates the hash to its head and tail, keeping the 0x prefix', () => {
        const link = explorerLinkForActivity({
            ...base,
            txIds: ['eth:0x8a00e8f1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9']
        });
        expect(link?.shortHash).toBe('0x8a00…e8f9');
    });

    it('keeps eight characters each side for prefix-less TON and BTC hashes', () => {
        const hash = '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b';
        const ton = explorerLinkForActivity({
            ...base,
            fromChain: 'ton',
            toChain: 'ton',
            txIds: [`ton:${hash}`]
        });
        expect(ton?.shortHash).toBe('1a2b3c4d…9e0f1a2b');
        const btc = explorerLinkForActivity({
            ...base,
            fromChain: 'btc',
            toChain: 'btc',
            txIds: [`btc:${hash}`]
        });
        expect(btc?.shortHash).toBe('1a2b3c4d…9e0f1a2b');
    });

    it('labels a cross-chain swap with the source-chain leg', () => {
        const link = explorerLinkForActivity({
            ...base,
            fromChain: 'base',
            toChain: 'arb',
            txIds: ['base:0xaaa', 'arb:0xbbb'],
            explorerUrl: 'https://base.blockscout.com/tx/0xaaa'
        });
        expect(link).toMatchObject({
            url: 'https://base.blockscout.com/tx/0xaaa',
            hash: '0xaaa'
        });
    });

    it('returns undefined when there is no tx id', () => {
        expect(explorerLinkForActivity({ ...base, txIds: [] })).toBeUndefined();
    });

    it('ignores whitespace-only tx ids', () => {
        expect(explorerLinkForActivity({ ...base, txIds: ['eth: '] })).toBeUndefined();
    });
});

describe('address formatting', () => {
    const tonRaw = '0:8f5d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d3e0a9d';

    it('renders TON addresses in non-bounceable friendly form', () => {
        const friendly = formatMultichainAddress(tonRaw, 'ton');
        expect(friendly.startsWith('U')).toBe(true);
        expect(friendly).not.toBe(tonRaw);
    });

    it('passes non-TON addresses through untouched', () => {
        expect(formatMultichainAddress('0xAbC123', 'eth')).toBe('0xAbC123');
    });

    it('falls back to the raw string for an unparseable TON address', () => {
        expect(formatMultichainAddress('not-an-address', 'ton')).toBe('not-an-address');
    });

    it('shortens a long address to 4…4, not counting the 0x prefix', () => {
        expect(shortenMultichainAddress('0x1234567890abcdef', 'eth')).toBe('0x1234…cdef');
    });
});

describe('reportMultichainPendingTransaction', () => {
    it('POSTs the snake_case wire shape to /transactions/pending', async () => {
        const fetchImpl = makeFetch(200, { ok: true });

        await reportMultichainPendingTransaction({
            walletId: 'w1',
            chain: 'eth',
            txHash: '0xdeadbeef',
            activityType: 'swap',
            payload: {
                from_asset_id: 'eth/mainnet/coin',
                to_asset_id: 'ton/mainnet/coin',
                route_id: 'route-1',
                provider_route_id: 'tx-1'
            },
            fetchImpl
        });

        const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [
            string,
            RequestInit
        ];
        expect(url).toBe('https://multi.tonkeeper.com/api/v1/wallets/w1/transactions/pending');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body as string)).toEqual({
            chain: 'eth',
            network: 'mainnet',
            tx_hash: '0xdeadbeef',
            activity_type: 'swap',
            payload: {
                from_asset_id: 'eth/mainnet/coin',
                to_asset_id: 'ton/mainnet/coin',
                route_id: 'route-1',
                provider_route_id: 'tx-1'
            }
        });
    });

    it('rejects on a non-2xx response', async () => {
        const fetchImpl = makeFetch(500, { error: 'boom' });

        await expect(
            reportMultichainPendingTransaction({
                walletId: 'w1',
                chain: 'ton',
                txHash: 'abc',
                activityType: 'send',
                fetchImpl
            })
        ).rejects.toBeTruthy();
    });
});

describe('isMultichainChain', () => {
    it('accepts every backend chain slug and rejects the rest', () => {
        for (const chain of [
            'ton',
            'eth',
            'base',
            'btc',
            'tron',
            'arb',
            'bsc',
            'sol',
            'avax',
            'polygon',
            'robinhood'
        ]) {
            expect(isMultichainChain(chain)).toBe(true);
        }
        expect(isMultichainChain('matic')).toBe(false);
        expect(isMultichainChain('placeholder')).toBe(false);
    });
});
