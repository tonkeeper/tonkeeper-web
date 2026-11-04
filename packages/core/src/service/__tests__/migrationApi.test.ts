/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

import { Configuration } from '../../tonApiV2';
import { getMigrationWallets, prepareMigration } from '../migration/migrationApi';

function makeApi(fetchImpl: typeof fetch) {
    return {
        tonApiV2: new Configuration({ basePath: 'https://tonapi.test', fetchApi: fetchImpl })
    };
}

function makeFetch(status: number, body: unknown): typeof fetch {
    return vi.fn(async () => {
        const text = JSON.stringify(body);
        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: 'STATUS',
            json: async () => body,
            text: async () => text
        } as Response;
    }) as unknown as typeof fetch;
}

const preparePayload = {
    from: '0:' + 'a'.repeat(64),
    to: '0:' + 'b'.repeat(64),
    wallet_version: 'v4r2',
    transactions: [
        {
            seqno: 42,
            boc: 'te6cckEBAQEAAgAAAEysuc0=',
            messages: [{ boc: 'te6cckEBAQEAAgAAAEysuc0=', mode: 3 }],
            emulation: {},
            gas_spent: 12345678,
            sponsored: false,
            state_init: 'te6cckEBAQEAAgAAAEysuc0='
        },
        {
            seqno: 43,
            boc: 'te6cckEBAQEAAgAAAEysuc0=',
            messages: [],
            emulation: {},
            gas_spent: '1000',
            sponsored: true
        }
    ]
};

describe('prepareMigration', () => {
    it('parses a successful prepare response', async () => {
        const fetchImpl = makeFetch(200, preparePayload);
        const prepared = await prepareMigration({
            api: makeApi(fetchImpl),
            from: preparePayload.from,
            to: preparePayload.to,
            currency: 'USD',
            gasPayer: 'self'
        });

        expect(prepared.insufficientFunds).toBe(false);
        expect(prepared.insufficientDetails).toBeUndefined();
        expect(prepared.result.walletVersion).toBe('v4r2');
        expect(prepared.result.transactions).toHaveLength(2);

        const [first, second] = prepared.result.transactions;
        expect(first.seqno).toBe(42);
        expect(first.messages).toEqual([{ boc: 'te6cckEBAQEAAgAAAEysuc0=', mode: 3 }]);
        expect(first.gasSpent).toBe('12345678');
        expect(first.sponsored).toBe(false);
        expect(first.stateInit).toBe('te6cckEBAQEAAgAAAEysuc0=');
        expect(second.sponsored).toBe(true);
        expect(second.stateInit).toBeUndefined();
    });

    it('sends the request body the backend expects', async () => {
        const fetchImpl = makeFetch(200, preparePayload);
        await prepareMigration({
            api: makeApi(fetchImpl),
            from: 'FROM',
            to: 'TO',
            currency: 'EUR',
            publicKey: 'PUBKEY',
            gasPayer: 'battery'
        });

        const [url, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toBe('https://tonapi.test/v2/migration/prepare');
        expect(JSON.parse(init.body)).toEqual({
            from: 'FROM',
            to: 'TO',
            currency: 'EUR',
            public_key: 'PUBKEY',
            gas_payer: 'battery'
        });
    });

    it('recovers a 409 insufficient-gas conflict into a usable prepare', async () => {
        const fetchImpl = makeFetch(409, {
            ...preparePayload,
            error: 'INSUFFICIENT_TON_FOR_GAS',
            error_code: 50000,
            details: { required: 500000000, available: 100000000 }
        });
        const prepared = await prepareMigration({
            api: makeApi(fetchImpl),
            from: 'FROM',
            to: 'TO',
            currency: 'USD',
            gasPayer: 'self'
        });

        expect(prepared.insufficientFunds).toBe(true);
        expect(prepared.insufficientDetails).toEqual({
            required: '500000000',
            available: '100000000'
        });
        expect(prepared.result.transactions).toHaveLength(2);
    });

    it('recovers a 409 with transactions but no known error code, without details', async () => {
        const fetchImpl = makeFetch(409, { ...preparePayload, error: 'CONFLICT' });
        const prepared = await prepareMigration({
            api: makeApi(fetchImpl),
            from: 'FROM',
            to: 'TO',
            currency: 'USD',
            gasPayer: 'self'
        });

        expect(prepared.insufficientFunds).toBe(true);
        expect(prepared.insufficientDetails).toBeUndefined();
    });

    it('throws on a 409 that carries no transactions', async () => {
        const fetchImpl = makeFetch(409, { error: 'something else' });
        await expect(
            prepareMigration({
                api: makeApi(fetchImpl),
                from: 'FROM',
                to: 'TO',
                currency: 'USD',
                gasPayer: 'self'
            })
        ).rejects.toThrow('status 409');
    });

    it('throws on server errors', async () => {
        const fetchImpl = makeFetch(500, { error: 'oops' });
        await expect(
            prepareMigration({
                api: makeApi(fetchImpl),
                from: 'FROM',
                to: 'TO',
                currency: 'USD',
                gasPayer: 'battery'
            })
        ).rejects.toThrow('Migration prepare (battery) failed with status 500');
    });
});

describe('getMigrationWallets', () => {
    it('parses wallet values and passes addresses and currencies', async () => {
        const fetchImpl = makeFetch(200, {
            wallets: [
                {
                    account: '0:' + 'a'.repeat(64),
                    balance: 1000000000,
                    status: 'active',
                    jettons: [],
                    nft_count: 3
                }
            ]
        });
        const wallets = await getMigrationWallets({
            api: makeApi(fetchImpl),
            addresses: ['0:' + 'a'.repeat(64), '0:' + 'b'.repeat(64)],
            currencies: ['USD']
        });

        expect(wallets).toHaveLength(1);
        expect(wallets[0].balance).toBe('1000000000');
        expect(wallets[0].status).toBe('active');
        expect(wallets[0].nftCount).toBe(3);

        const [url, init] = (fetchImpl as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toBe('https://tonapi.test/v2/migration/wallets?currencies=USD');
        expect(JSON.parse(init.body)).toEqual({
            account_ids: ['0:' + 'a'.repeat(64), '0:' + 'b'.repeat(64)]
        });
    });

    it('throws on a failed response', async () => {
        const fetchImpl = makeFetch(502, {});
        await expect(
            getMigrationWallets({ api: makeApi(fetchImpl), addresses: ['0:' + 'a'.repeat(64)] })
        ).rejects.toThrow('status 502');
    });
});
