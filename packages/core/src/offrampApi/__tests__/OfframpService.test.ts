/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createOfframpOrder, fetchOfframpAsset, fetchOfframpQuote } from '../OfframpService';
import { ResponseError } from '../../swapsApiGenerated';

const BASE = 'https://swaps.tonkeeper.com/';

let fetchMock: ReturnType<typeof vi.fn>;

function stubFetch(status: number, body: unknown): void {
    fetchMock = vi.fn(
        async () =>
            new Response(JSON.stringify(body), {
                status,
                headers: { 'Content-Type': 'application/json' }
            })
    );
    vi.stubGlobal('fetch', fetchMock);
}

function lastCall(): [string, RequestInit] {
    return fetchMock.mock.calls[0] as [string, RequestInit];
}

afterEach(() => vi.unstubAllGlobals());

describe('fetchOfframpAsset', () => {
    it('decodes payout methods with providers and limits', async () => {
        stubFetch(200, {
            asset_id: 'ton/mainnet/coin',
            symbol: 'TON',
            decimals: 9,
            stablecoin: false,
            extra_id_required: false,
            payout_methods: [
                {
                    type: 'card',
                    name: 'Card',
                    image: 'card.svg',
                    providers: [{ merchant: 'mercuryo', fiat: 'EUR', limits: { min: 20 } }]
                }
            ]
        });
        const res = await fetchOfframpAsset(BASE, { assetId: 'ton/mainnet/coin', lang: 'de' });
        expect(res.payoutMethods[0].providers[0]).toEqual({
            merchant: 'mercuryo',
            fiat: 'EUR',
            limits: { min: 20 }
        });
        const [url] = lastCall();
        expect(url).toContain('/v2/offramp/asset?');
        expect(url).toContain('asset_id=ton%2Fmainnet%2Fcoin');
        expect(url).toContain('lang=de');
    });

    it('rejects with a ResponseError on a non-2xx response', async () => {
        stubFetch(404, {});
        await expect(fetchOfframpAsset(BASE, { assetId: 'x' })).rejects.toBeInstanceOf(
            ResponseError
        );
    });
});

describe('fetchOfframpQuote', () => {
    it('POSTs a snake_case wire body and decodes the quotes', async () => {
        stubFetch(200, {
            items: [
                {
                    merchant: 'mercuryo',
                    payout_method: 'card',
                    amount_in: '10',
                    amount_out: '54',
                    rate: '5.4',
                    fees: { total: '1' },
                    date_expire: '2026-01-01T00:00:00Z',
                    merchant_transaction_id: 'tx-1'
                }
            ],
            suggested: [],
            unavailable_reason: 'amount_too_low'
        });
        const res = await fetchOfframpQuote(BASE, {
            offrampQuoteRequest: {
                sourceAssetId: 'ton/mainnet/coin',
                fiat: 'USD',
                amount: '10',
                payoutMethod: 'card'
            }
        });
        const [url, options] = lastCall();
        expect(url).toBe('https://swaps.tonkeeper.com/v2/offramp/quote');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body as string)).toEqual({
            source_asset_id: 'ton/mainnet/coin',
            fiat: 'USD',
            amount: '10',
            payout_method: 'card'
        });
        expect(res.items[0]).toMatchObject({ payoutMethod: 'card', merchantTransactionId: 'tx-1' });
        expect(res.unavailableReason).toBe('amount_too_low');
    });
});

describe('createOfframpOrder', () => {
    const createOfframpOrderRequest = {
        sourceAssetId: 'ton/mainnet/coin',
        fiat: 'USD',
        amount: '10',
        fromAddress: 'EQ...abc',
        payoutMethod: 'card' as const,
        merchant: 'mercuryo' as const
    };
    const order = {
        id: 'order-1',
        merchant: 'mercuryo',
        status: 'pending',
        widget_url: 'https://widget',
        payin_address: 'EQ...payin',
        amount_in: '10',
        amount_out: '54',
        rate: '5.4',
        fees: { total: '1' },
        date_create: '2026-01-01T00:00:00Z'
    };

    it('POSTs a snake_case wire body, mints an Idempotency-Key and decodes the order', async () => {
        stubFetch(200, order);
        const res = await createOfframpOrder(BASE, { createOfframpOrderRequest });
        const [url, options] = lastCall();
        expect(url).toContain('/v2/offramp/orders');
        expect(JSON.parse(options.body as string)).toMatchObject({
            source_asset_id: 'ton/mainnet/coin',
            from_address: 'EQ...abc',
            payout_method: 'card'
        });
        expect(new Headers(options.headers).get('Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);
        expect(res).toMatchObject({ widgetUrl: 'https://widget', payinAddress: 'EQ...payin' });
    });

    it('forwards a supplied Idempotency-Key', async () => {
        stubFetch(200, order);
        await createOfframpOrder(BASE, { createOfframpOrderRequest, idempotencyKey: 'retry-1' });
        expect(new Headers(lastCall()[1].headers).get('Idempotency-Key')).toBe('retry-1');
    });
});
