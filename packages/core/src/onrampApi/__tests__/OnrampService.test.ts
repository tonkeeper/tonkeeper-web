/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    createOnrampOrder,
    createP2PSession,
    fetchExchangeLayout,
    fetchExchangeLayoutPreferringFiat,
    fetchOnrampAsset,
    fetchOnrampChains,
    fetchOnrampConfiguration,
    fetchOnrampQuote
} from '../OnrampService';
import { ResponseError } from '../../swapsApiGenerated';

const BASE = 'https://swaps.tonkeeper.com/';

let fetchMock: ReturnType<typeof vi.fn>;

const jsonResponse = (status: number, body: unknown): Response =>
    new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });

function stubFetch(status: number, body: unknown): void {
    fetchMock = vi.fn(async () => jsonResponse(status, body));
    vi.stubGlobal('fetch', fetchMock);
}

function stubFetchSequence(responses: { status: number; body: unknown }[]): void {
    let call = 0;
    fetchMock = vi.fn(async () => {
        const { status, body } = responses[Math.min(call, responses.length - 1)];
        call += 1;
        return jsonResponse(status, body);
    });
    vi.stubGlobal('fetch', fetchMock);
}

function lastCall(): [string, RequestInit] {
    return fetchMock.mock.calls[0] as [string, RequestInit];
}

const header = (init: RequestInit, name: string): string | null =>
    new Headers(init.headers).get(name);

afterEach(() => vi.unstubAllGlobals());

describe('fetchOnrampConfiguration', () => {
    it('decodes the snake_case asset rows into the generated model', async () => {
        stubFetch(200, {
            assets: [
                {
                    asset_id: 'ton/mainnet/coin',
                    symbol: 'TON',
                    network_name: 'TON',
                    decimals: 9,
                    stablecoin: false,
                    extra_id_required: false,
                    available_methods: ['card'],
                    available_fiats: ['USD', 'EUR']
                }
            ],
            next_cursor: 'c1'
        });
        const res = await fetchOnrampConfiguration(BASE, {});
        expect(res.assets[0]).toMatchObject({
            assetId: 'ton/mainnet/coin',
            networkName: 'TON',
            extraIdRequired: false,
            availableMethods: ['card'],
            availableFiats: ['USD', 'EUR']
        });
        expect(res.nextCursor).toBe('c1');
    });

    it('builds a query-less URL when no params are given', async () => {
        stubFetch(200, { assets: [] });
        await fetchOnrampConfiguration(BASE, {});
        const [url] = lastCall();
        expect(url).toBe('https://swaps.tonkeeper.com/v2/onramp/configuration');
    });

    it('sends supplied params as snake_case query keys', async () => {
        stubFetch(200, { assets: [] });
        await fetchOnrampConfiguration(BASE, {
            fiat: 'USD',
            destinationChain: 'ton',
            deviceCountryCode: 'DE'
        });
        const [url] = lastCall();
        expect(url).toContain('/v2/onramp/configuration?');
        expect(url).toContain('fiat=USD');
        expect(url).toContain('destination_chain=ton');
        expect(url).toContain('device_country_code=DE');
        expect(url).not.toContain('deviceCountryCode');
    });

    it('rejects with a ResponseError on a non-2xx response', async () => {
        stubFetch(500, {});
        await expect(fetchOnrampConfiguration(BASE, {})).rejects.toBeInstanceOf(ResponseError);
    });

    it('sends search, paging and the wallet id', async () => {
        stubFetch(200, { assets: [] });
        await fetchOnrampConfiguration(BASE, {
            q: 'usd',
            destinationChain: 'eth/mainnet',
            cursor: 'c1',
            limit: 30,
            xWalletID: 'wallet-1'
        });
        const [url, init] = lastCall();
        expect(url).toContain('q=usd');
        expect(url).toContain('destination_chain=eth%2Fmainnet');
        expect(url).toContain('cursor=c1');
        expect(url).toContain('limit=30');
        expect(header(init, 'X-Wallet-ID')).toBe('wallet-1');
    });
});

describe('fetchOnrampChains', () => {
    it('decodes the chain list and sends the fiat', async () => {
        stubFetch(200, { chains: ['ton', 'eth', 'bsc'] });
        const res = await fetchOnrampChains(BASE, { fiat: 'EUR' });
        expect(res.chains).toEqual(['ton', 'eth', 'bsc']);
        const [url] = lastCall();
        expect(url).toContain('/v2/onramp/chains?');
        expect(url).toContain('fiat=EUR');
    });
});

describe('fetchOnrampAsset', () => {
    it('decodes the nested payment methods, providers and limits', async () => {
        stubFetch(200, {
            asset_id: 'ton/mainnet/coin',
            symbol: 'TON',
            decimals: 9,
            stablecoin: false,
            extra_id_required: true,
            extra_id_name: 'memo',
            payment_methods: [
                {
                    type: 'card',
                    name: 'Card',
                    image: 'card.svg',
                    providers: [
                        { merchant: 'mercuryo', fiat: 'USD', limits: { min: 10, max: 1000 } },
                        { merchant: 'neocrypto', fiat: 'EUR' }
                    ]
                }
            ]
        });
        const res = await fetchOnrampAsset(BASE, { assetId: 'ton/mainnet/coin' });
        expect(res).toMatchObject({
            assetId: 'ton/mainnet/coin',
            extraIdRequired: true,
            extraIdName: 'memo'
        });
        expect(res.paymentMethods[0].providers[0].limits).toEqual({ min: 10, max: 1000 });
        expect(res.paymentMethods[0].providers[1].limits).toBeUndefined();
    });

    it('puts the asset id in the query string', async () => {
        stubFetch(200, {
            asset_id: 'x',
            symbol: 'X',
            decimals: 0,
            stablecoin: false,
            extra_id_required: false,
            payment_methods: []
        });
        await fetchOnrampAsset(BASE, { assetId: 'ton/mainnet/coin' });
        const [url] = lastCall();
        expect(url).toContain('/v2/onramp/asset?');
        expect(url).toContain('asset_id=ton%2Fmainnet%2Fcoin');
    });

    it('rejects with a ResponseError on a non-2xx response', async () => {
        stubFetch(404, {});
        await expect(fetchOnrampAsset(BASE, { assetId: 'x' })).rejects.toBeInstanceOf(
            ResponseError
        );
    });
});

describe('fetchExchangeLayout', () => {
    it('decodes layout cards and sends the flow parameter', async () => {
        stubFetch(200, {
            items: [
                {
                    title: 'Buy crypto',
                    description: 'Cards, P2P & more',
                    image: 'buy.svg',
                    preferred_currency: 'USD'
                }
            ]
        });
        const res = await fetchExchangeLayout(BASE, { flow: 'deposit', currency: 'USD' });
        expect(res.items[0]).toEqual({
            title: 'Buy crypto',
            description: 'Cards, P2P & more',
            image: 'buy.svg',
            preferredCurrency: 'USD'
        });
        const [url] = lastCall();
        expect(url).toContain('/v2/exchange/layout?');
        expect(url).toContain('flow=deposit');
        expect(url).toContain('currency=USD');
    });

    it('rejects with a ResponseError on a non-2xx response', async () => {
        stubFetch(502, {});
        await expect(fetchExchangeLayout(BASE, { flow: 'withdraw' })).rejects.toBeInstanceOf(
            ResponseError
        );
    });
});

describe('fetchExchangeLayoutPreferringFiat', () => {
    const CARD = { title: 'Buy', description: '', image: '', preferred_currency: 'EUR' };

    it('requests the given fiat and returns its layout when it has cards', async () => {
        stubFetchSequence([{ status: 200, body: { items: [CARD] } }]);
        const res = await fetchExchangeLayoutPreferringFiat(BASE, { flow: 'deposit' }, 'EUR');
        expect(res.items[0].preferredCurrency).toBe('EUR');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect((fetchMock.mock.calls[0] as [string])[0]).toContain('currency=EUR');
    });

    it('skips the currency request entirely when no fiat is given', async () => {
        stubFetchSequence([{ status: 200, body: { items: [CARD] } }]);
        await fetchExchangeLayoutPreferringFiat(BASE, { flow: 'deposit' }, undefined);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect((fetchMock.mock.calls[0] as [string])[0]).not.toContain('currency=');
    });

    it('falls back to the geo layout when the fiat is rejected with a 4xx', async () => {
        stubFetchSequence([
            { status: 400, body: {} },
            { status: 200, body: { items: [CARD] } }
        ]);
        const res = await fetchExchangeLayoutPreferringFiat(BASE, { flow: 'deposit' }, 'SZL');
        expect(res.items).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect((fetchMock.mock.calls[1] as [string])[0]).not.toContain('currency=');
    });

    it('falls back to the geo layout when the fiat layout has no cards', async () => {
        stubFetchSequence([
            { status: 200, body: { items: [] } },
            { status: 200, body: { items: [CARD] } }
        ]);
        const res = await fetchExchangeLayoutPreferringFiat(BASE, { flow: 'deposit' }, 'EUR');
        expect(res.items).toHaveLength(1);
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('propagates a 5xx instead of falling back', async () => {
        stubFetchSequence([{ status: 503, body: {} }]);
        await expect(
            fetchExchangeLayoutPreferringFiat(BASE, { flow: 'deposit' }, 'EUR')
        ).rejects.toBeInstanceOf(ResponseError);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

describe('fetchOnrampQuote', () => {
    const onrampQuoteRequest = {
        targetAssetId: 'ton/mainnet/coin',
        fiat: 'USD',
        amount: '100',
        reverse: false,
        paymentMethod: 'card' as const,
        merchant: 'mercuryo' as const
    };

    it('POSTs a snake_case wire body and decodes the response', async () => {
        stubFetch(200, {
            items: [
                {
                    merchant: 'mercuryo',
                    payment_method: 'card',
                    amount_in: '100',
                    amount_out: '54',
                    rate: '0.54',
                    fees: { total: '1' },
                    date_expire: '2026-01-01T00:00:00Z',
                    merchant_transaction_id: 'tx-1'
                }
            ],
            suggested: []
        });
        const res = await fetchOnrampQuote(BASE, { onrampQuoteRequest, timezone: 'Europe/Berlin' });

        const [url, options] = lastCall();
        expect(url).toContain('/v2/onramp/quote?');
        expect(url).toContain('timezone=Europe%2FBerlin');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body as string)).toEqual({
            target_asset_id: 'ton/mainnet/coin',
            fiat: 'USD',
            amount: '100',
            reverse: false,
            payment_method: 'card',
            merchant: 'mercuryo'
        });

        expect(res.items[0]).toMatchObject({
            paymentMethod: 'card',
            amountIn: '100',
            amountOut: '54',
            merchantTransactionId: 'tx-1'
        });
        expect(res.suggested).toEqual([]);
    });

    it('omits optional wire fields that are unset', async () => {
        stubFetch(200, { items: [], suggested: [] });
        await fetchOnrampQuote(BASE, {
            onrampQuoteRequest: { targetAssetId: 'ton', fiat: 'USD', amount: '100' }
        });
        const [url, options] = lastCall();
        expect(url).toBe('https://swaps.tonkeeper.com/v2/onramp/quote');
        const wire = JSON.parse(options.body as string);
        expect(wire).not.toHaveProperty('payment_method');
        expect(wire).not.toHaveProperty('merchant');
        expect(wire).not.toHaveProperty('reverse');
    });

    it('rejects with a ResponseError on a non-2xx response', async () => {
        stubFetch(400, {});
        await expect(fetchOnrampQuote(BASE, { onrampQuoteRequest })).rejects.toBeInstanceOf(
            ResponseError
        );
    });
});

describe('createOnrampOrder', () => {
    const createOnrampOrderRequest = {
        targetAssetId: 'ton/mainnet/coin',
        fiat: 'USD',
        amount: '100',
        destinationAddress: 'EQ...abc',
        paymentMethod: 'card' as const,
        merchant: 'mercuryo' as const,
        merchantTransactionId: 'tx-1'
    };
    const order = {
        id: 'order-1',
        merchant: 'mercuryo',
        merchant_transaction_id: 'tx-1',
        status: 'pending',
        widget_url: 'https://widget',
        destination_address: 'EQ...abc',
        amount_in: '100',
        amount_out: '54',
        rate: '0.54',
        fees: { total: '1' },
        date_create: '2026-01-01T00:00:00Z'
    };

    it('POSTs a snake_case wire body and decodes the order', async () => {
        stubFetch(200, order);
        const res = await createOnrampOrder(BASE, { createOnrampOrderRequest });

        const [url, options] = lastCall();
        expect(url).toContain('/v2/onramp/orders');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body as string)).toMatchObject({
            target_asset_id: 'ton/mainnet/coin',
            destination_address: 'EQ...abc',
            payment_method: 'card',
            merchant: 'mercuryo',
            merchant_transaction_id: 'tx-1'
        });

        expect(res).toMatchObject({
            id: 'order-1',
            widgetUrl: 'https://widget',
            destinationAddress: 'EQ...abc',
            amountOut: '54'
        });
    });

    it('mints an Idempotency-Key when none is given and forwards a supplied one', async () => {
        stubFetch(200, order);
        await createOnrampOrder(BASE, { createOnrampOrderRequest });
        expect(header(lastCall()[1], 'Idempotency-Key')).toMatch(/^[0-9a-f-]{36}$/);

        stubFetch(200, order);
        await createOnrampOrder(BASE, { createOnrampOrderRequest, idempotencyKey: 'retry-1' });
        expect(header(lastCall()[1], 'Idempotency-Key')).toBe('retry-1');
    });

    it('rejects with a ResponseError on a non-2xx response', async () => {
        stubFetch(409, {});
        await expect(createOnrampOrder(BASE, { createOnrampOrderRequest })).rejects.toBeInstanceOf(
            ResponseError
        );
    });
});

describe('createP2PSession', () => {
    const body = {
        wallet: '0:27ba...06f3',
        network: 'ton',
        cryptoCurrency: 'TON',
        fiatCurrency: 'USD'
    };

    it('POSTs a snake_case wire body and decodes the session', async () => {
        stubFetch(200, {
            deeplink_url: 'https://p2p.example/session/1',
            date_expire: '2026-01-01T00:10:00Z'
        });
        const res = await createP2PSession(BASE, body);

        const [url, options] = lastCall();
        expect(url).toBe('https://swaps.tonkeeper.com/v2/p2p/session');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body as string)).toEqual({
            wallet: '0:27ba...06f3',
            network: 'ton',
            crypto_currency: 'TON',
            fiat_currency: 'USD'
        });

        expect(res).toEqual({
            deeplinkUrl: 'https://p2p.example/session/1',
            dateExpire: '2026-01-01T00:10:00Z'
        });
    });

    it('forwards the optional amount', async () => {
        stubFetch(200, { deeplink_url: 'https://p2p', date_expire: 'x' });
        await createP2PSession(BASE, { ...body, amount: 25 });
        expect(JSON.parse(lastCall()[1].body as string)).toMatchObject({ amount: 25 });
    });

    it('rejects with a ResponseError on a non-2xx response', async () => {
        stubFetch(400, {});
        await expect(createP2PSession(BASE, body)).rejects.toBeInstanceOf(ResponseError);
    });
});
