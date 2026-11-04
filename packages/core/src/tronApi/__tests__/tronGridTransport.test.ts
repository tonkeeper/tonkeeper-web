/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

import { TronApiHttpError } from '../../errors/TronApiHttpError';
import {
    createTronGridFetch,
    parseTronGridCooldownMs,
    tronGridMethodKey,
    tronGridRetryCooldownMs
} from '../tronGridTransport';

const ADDRESS = 'TBd26SA8GEjMULmD7ATK2tFDWMmgbNEuMZ';

const response = (status: number, body = '', headers: Record<string, string> = {}) =>
    new Response(body, { status, headers });

const harness = (responses: Array<Response | Error>) => {
    let clock = 0;
    const sleeps: number[] = [];
    const fetchImpl = vi.fn(async () => {
        const next = responses.shift();
        if (!next) {
            throw new Error('unexpected request');
        }
        if (next instanceof Error) {
            throw next;
        }
        return next;
    });
    const tronFetch = createTronGridFetch({
        fetchImpl,
        now: () => clock,
        sleep: async ms => {
            sleeps.push(ms);
            clock += ms;
        }
    });
    return { tronFetch, fetchImpl, sleeps };
};

describe('tronGridMethodKey', () => {
    it('collapses address segments so one method shares one slot', () => {
        expect(tronGridMethodKey(new URL(`https://api.trongrid.io/v1/accounts/${ADDRESS}`))).toBe(
            'https://api.trongrid.io/v1/accounts/*'
        );
        expect(
            tronGridMethodKey(
                new URL(`https://api.trongrid.io/v1/accounts/${ADDRESS}/transactions/trc20`)
            )
        ).toBe('https://api.trongrid.io/v1/accounts/*/transactions/trc20');
    });
});

describe('parseTronGridCooldownMs', () => {
    it('prefers Retry-After, then the suspension message in the body', () => {
        expect(parseTronGridCooldownMs('4', '')).toBe(4000);
        expect(
            parseTronGridCooldownMs(
                null,
                'the request rate of (getAccount) has been suspended for 1 s'
            )
        ).toBe(1000);
        expect(parseTronGridCooldownMs(null, 'suspended for 2 minutes')).toBeUndefined();
        expect(parseTronGridCooldownMs(null, 'Too Many Requests')).toBeUndefined();
    });
});

describe('tronGridRetryCooldownMs', () => {
    it('starts rate-limit pauses at 3s, doubles them and caps at 10s', () => {
        expect(tronGridRetryCooldownMs({ attempt: 0, status: 429 })).toBe(3000);
        expect(tronGridRetryCooldownMs({ attempt: 1, status: 429 })).toBe(6000);
        expect(tronGridRetryCooldownMs({ attempt: 2, status: 429 })).toBe(10000);
    });

    it('lets an announced cooldown raise the pause but not lower it', () => {
        expect(tronGridRetryCooldownMs({ attempt: 0, status: 429, announcedMs: 5000 })).toBe(5000);
        expect(tronGridRetryCooldownMs({ attempt: 0, status: 429, announcedMs: 1000 })).toBe(3000);
    });

    it('backs off exponentially from 1s for server and network errors', () => {
        expect(tronGridRetryCooldownMs({ attempt: 0, status: 502 })).toBe(1000);
        expect(tronGridRetryCooldownMs({ attempt: 1 })).toBe(2000);
    });
});

describe('createTronGridFetch', () => {
    it('spaces requests to the same method by 1250ms', async () => {
        const { tronFetch, sleeps } = harness([response(200), response(200), response(200)]);

        await Promise.all([
            tronFetch(`https://api.trongrid.io/v1/accounts/${ADDRESS}`),
            tronFetch(`https://api.trongrid.io/v1/accounts/${ADDRESS}`),
            tronFetch('https://api.trongrid.io/wallet/getaccountnet')
        ]);

        expect(sleeps).toEqual([1250]);
    });

    it('retries a 429 twice, then throws the rate-limit error', async () => {
        const { tronFetch, fetchImpl } = harness([response(429), response(429), response(429)]);

        const error = await tronFetch('https://api.trongrid.io/jsonrpc').catch(e => e);

        expect(fetchImpl).toHaveBeenCalledTimes(3);
        expect(error).toBeInstanceOf(TronApiHttpError);
        expect((error as TronApiHttpError).isRateLimit).toBe(true);
    });

    it('recovers when a retry succeeds', async () => {
        const { tronFetch, sleeps } = harness([
            response(429, 'suspended for 1 s'),
            new TypeError('Failed to fetch'),
            response(200, '{}')
        ]);

        const result = await tronFetch('https://api.trongrid.io/jsonrpc');

        expect(result.status).toBe(200);
        expect(sleeps).toContain(3000);
        expect(sleeps).toContain(2000);
    });

    it('does not retry client errors', async () => {
        const { tronFetch, fetchImpl } = harness([response(400)]);

        await expect(tronFetch('https://api.trongrid.io/jsonrpc')).rejects.toBeInstanceOf(
            TronApiHttpError
        );
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('never retries a broadcast', async () => {
        const { tronFetch, fetchImpl } = harness([response(503)]);

        await expect(
            tronFetch('https://api.trongrid.io/wallet/broadcasttransaction', { method: 'POST' })
        ).rejects.toBeInstanceOf(TronApiHttpError);
        expect(fetchImpl).toHaveBeenCalledTimes(1);
    });
});
