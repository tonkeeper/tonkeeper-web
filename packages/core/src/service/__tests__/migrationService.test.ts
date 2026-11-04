/* eslint-disable import/no-extraneous-dependencies */
import { Address, beginCell, internal, storeMessageRelaxed } from '@ton/core';
import BigNumber from 'bignumber.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CellSigner } from '../../entries/signer';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';
import { Configuration as BatteryConfiguration } from '../../batteryApi';
import { Configuration, MessageConsequences } from '../../tonApiV2';
import { TronApi } from '../../tronApi';
import { MigrationTransaction } from '../migration/migrationApi';
import {
    executeMigration,
    loadMigratableWalletValues,
    loadMigrationTronBalances,
    MigrationExecutionError,
    MigrationProgress,
    PreparedMigration
} from '../migration/migrationService';
import { MigrationBatteryAccess } from '../migration/migrationBattery';
import { emptyMigrationTronPlan } from '../migration/migrationTronService';
import { MigrationVerificationContext } from '../migration/migrationVerifier';

const WALLET: TonWalletStandard = {
    id: '0:' + 'c'.repeat(64),
    rawAddress: '0:' + 'c'.repeat(64),
    publicKey: '5754865e86d0ade1199301bbb0319a25ed6b129c4b0a57f28f62449b3df9c522',
    version: WalletVersion.V4R2
};

const SIGNER: CellSigner = Object.assign(async () => Buffer.alloc(64, 7), {
    type: 'cell' as const
});

const DESTINATION = '0:' + 'b'.repeat(64);

const CONTEXT: MigrationVerificationContext = {
    source: Address.parse(WALLET.rawAddress),
    destination: Address.parse(DESTINATION),
    jettonWallets: new Map(),
    nfts: new Map()
};

function makeTransaction(seqno: number, sponsored = false, to = DESTINATION): MigrationTransaction {
    const message = beginCell()
        .store(storeMessageRelaxed(internal({ to, value: 1000n, bounce: false })))
        .endCell();
    const body = beginCell()
        .storeUint(698983191, 32)
        .storeUint(1755000000, 32)
        .storeUint(seqno, 32)
        .storeUint(0, 8)
        .endCell();
    return {
        seqno,
        boc: body.toBoc().toString('base64'),
        messages: [{ boc: message.toBoc().toString('base64'), mode: 3 }],
        emulation: {} as MessageConsequences,
        gasSpent: '1000',
        sponsored
    };
}

function makePrepared(
    transactions: MigrationTransaction[],
    feeMethod: 'ton' | 'battery' = 'ton'
): PreparedMigration {
    const variant = {
        gasPayer: feeMethod,
        prepared: {
            result: {
                from: WALLET.rawAddress,
                to: DESTINATION,
                walletVersion: 'v4r2',
                transactions
            },
            insufficientFunds: false
        },
        verified: [],
        verificationContext: CONTEXT,
        totalGasSpent: new BigNumber(0),
        sponsoredGasSpent: new BigNumber(0)
    };
    return {
        ton: feeMethod === 'battery' ? { battery: variant } : { self: variant },
        tron: emptyMigrationTronPlan(),
        errors: {}
    };
}

interface RouteLog {
    url: string;
    headers: Record<string, string>;
}

function makeRoutedApi(options: { seqno: () => number; messageStatus?: (call: number) => number }) {
    const log: RouteLog[] = [];
    let messageCalls = 0;
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
        log.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
        let status = 200;
        let body: unknown = {};
        if (url.includes('/seqno')) {
            body = { seqno: options.seqno() };
        } else if (url.includes('/v2/blockchain/message')) {
            messageCalls += 1;
            status = options.messageStatus?.(messageCalls) ?? 200;
        }
        const text = JSON.stringify(body);
        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: 'STATUS',
            json: async () => body,
            text: async () => text
        } as Response;
    }) as unknown as typeof fetch;

    return {
        api: {
            tonApiV2: new Configuration({ basePath: 'https://tonapi.test', fetchApi: fetchImpl })
        },
        log
    };
}

function makeBatteryAccess(
    log: RouteLog[],
    pending: () => number = () => 0,
    messageResponse: (call: number) => { status: number; body: unknown } = () => ({
        status: 200,
        body: {}
    })
): MigrationBatteryAccess {
    let messageCalls = 0;
    const fetchApi = vi.fn(async (url: string, init?: RequestInit) => {
        log.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
        let status = 200;
        let body: unknown = {};
        if (url.endsWith('/status')) {
            body = {
                pending_transactions: Array.from({ length: pending() }, (_, i) => ({
                    id: `${i}`
                }))
            };
        } else if (url.endsWith('/message')) {
            messageCalls += 1;
            ({ status, body } = messageResponse(messageCalls));
        }
        return {
            ok: status >= 200 && status < 300,
            status,
            statusText: 'STATUS',
            json: async () => body,
            text: async () => JSON.stringify(body)
        } as Response;
    }) as unknown as typeof fetch;
    return {
        api: new BatteryConfiguration({ basePath: 'https://battery.test', fetchApi }),
        authToken: 'TOKEN'
    };
}

describe('executeMigration', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('sends the TON batch in order, waiting for the seqno between sends', async () => {
        let chainSeqno = 10;
        const { api, log } = makeRoutedApi({ seqno: () => chainSeqno });
        const progress: MigrationProgress[] = [];

        const promise = executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(10), makeTransaction(11)]),
            feeMethod: 'ton',
            signer: SIGNER,
            onProgress: p => progress.push(p)
        });
        // Unhandled-rejection guard while timers advance.
        const settled = promise.catch(e => e);

        // First message lands, the chain advances, the waiter should see it.
        await vi.advanceTimersByTimeAsync(1000);
        chainSeqno = 11;
        await vi.advanceTimersByTimeAsync(10_000);

        const result = await settled;
        expect(result).toBeUndefined();

        const messageSends = log.filter(l => l.url.includes('/v2/blockchain/message'));
        expect(messageSends).toHaveLength(2);
        expect(messageSends[0].headers['X-Migration-Fee']).toBe('native');
        expect(messageSends[0].headers['X-Migration-ID']).toBeTruthy();
        expect(messageSends[0].headers['X-Migration-ID']).toBe(
            messageSends[1].headers['X-Migration-ID']
        );
        expect(messageSends[0].headers['Content-Type']).toBe('application/json');

        expect(progress).toEqual([
            { part: 'ton', sentTransactions: 1, totalTransactions: 2 },
            { part: 'ton', sentTransactions: 2, totalTransactions: 2 }
        ]);
    });

    it('reports a partial failure when a later transaction fails to send', async () => {
        let chainSeqno = 10;
        const { api } = makeRoutedApi({
            seqno: () => chainSeqno,
            messageStatus: call => (call === 2 ? 500 : 200)
        });

        const promise = executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(10), makeTransaction(11)]),
            feeMethod: 'ton',
            signer: SIGNER
        });
        const settled = promise.catch(e => e);

        await vi.advanceTimersByTimeAsync(1000);
        chainSeqno = 11;
        await vi.advanceTimersByTimeAsync(10_000);

        const error = await settled;
        expect(error).toBeInstanceOf(MigrationExecutionError);
        expect(error.part).toBe('ton');
        expect(error.isPartial).toBe(true);
    });

    it('fails as non-partial when the first transaction cannot be sent', async () => {
        const { api } = makeRoutedApi({ seqno: () => 10, messageStatus: () => 500 });

        const error = await executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(10)]),
            feeMethod: 'ton',
            signer: SIGNER
        }).catch(e => e);

        expect(error).toBeInstanceOf(MigrationExecutionError);
        expect(error.part).toBe('ton');
        expect(error.isPartial).toBe(false);
    });

    it('fails as partial when the seqno never advances', async () => {
        const { api } = makeRoutedApi({ seqno: () => 10 });

        const promise = executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(10), makeTransaction(11)]),
            feeMethod: 'ton',
            signer: SIGNER
        });
        const settled = promise.catch(e => e);

        await vi.advanceTimersByTimeAsync(70_000);

        const error = await settled;
        expect(error).toBeInstanceOf(MigrationExecutionError);
        expect(error.message).toContain('Timed out waiting for wallet seqno');
        expect(error.part).toBe('ton');
        expect(error.isPartial).toBe(true);
    });

    it('sends sponsored transactions through Battery and the rest on-chain', async () => {
        let chainSeqno = 5;
        const { api, log } = makeRoutedApi({ seqno: () => chainSeqno });
        const battery = makeBatteryAccess(log);

        const promise = executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(5, true), makeTransaction(6)], 'battery'),
            feeMethod: 'battery',
            battery,
            signer: SIGNER
        });
        const settled = promise.catch(e => e);

        await vi.advanceTimersByTimeAsync(1500);
        chainSeqno = 6;
        await vi.advanceTimersByTimeAsync(10_000);

        expect(await settled).toBeUndefined();

        const statusIndex = log.findIndex(l => l.url === 'https://battery.test/status');
        const batterySendIndex = log.findIndex(l => l.url === 'https://battery.test/message');
        expect(statusIndex).toBeGreaterThanOrEqual(0);
        expect(batterySendIndex).toBeGreaterThan(statusIndex);
        const batterySend = log[batterySendIndex];
        expect(batterySend.headers['X-TonConnect-Auth']).toBe('TOKEN');
        expect(batterySend.headers['X-Migration-Fee']).toBe('battery');

        const chainSends = log.filter(l => l.url.includes('/v2/blockchain/message'));
        expect(chainSends).toHaveLength(1);
        expect(chainSends[0].headers['X-Migration-Fee']).toBe('battery');
        expect(chainSends[0].headers['X-Migration-ID']).toBe(batterySend.headers['X-Migration-ID']);
    });

    it('waits for Battery to finish its pending transaction before the next sponsored send', async () => {
        let pending = 1;
        const { api, log } = makeRoutedApi({ seqno: () => 5 });
        const battery = makeBatteryAccess(log, () => pending);

        const promise = executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(5, true)], 'battery'),
            feeMethod: 'battery',
            battery,
            signer: SIGNER
        });
        const settled = promise.catch(e => e);

        await vi.advanceTimersByTimeAsync(4000);
        expect(log.some(l => l.url === 'https://battery.test/message')).toBe(false);

        pending = 0;
        await vi.advanceTimersByTimeAsync(2000);

        expect(await settled).toBeUndefined();
        expect(log.filter(l => l.url === 'https://battery.test/message')).toHaveLength(1);
    });

    const PENDING_MESSAGES = {
        status: 400,
        body: {
            error: 'You have a pending message. Try again later.',
            'error-key': 'err-gasless-pending-messages'
        }
    };

    it('retries a sponsored send Battery rejects as still pending', async () => {
        const { api, log } = makeRoutedApi({ seqno: () => 5 });
        const battery = makeBatteryAccess(log, undefined, call =>
            call === 1 ? PENDING_MESSAGES : { status: 200, body: {} }
        );

        const settled = executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(5, true)], 'battery'),
            feeMethod: 'battery',
            battery,
            signer: SIGNER
        }).catch(e => e);

        await vi.advanceTimersByTimeAsync(10_000);

        expect(await settled).toBeUndefined();
        expect(log.filter(l => l.url === 'https://battery.test/message')).toHaveLength(2);
    });

    it('does not resend a rejected sponsored message once its seqno has landed', async () => {
        let chainSeqno = 5;
        const { api, log } = makeRoutedApi({ seqno: () => chainSeqno });
        const battery = makeBatteryAccess(log, undefined, () => {
            chainSeqno = 6;
            return PENDING_MESSAGES;
        });

        const settled = executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(5, true)], 'battery'),
            feeMethod: 'battery',
            battery,
            signer: SIGNER
        }).catch(e => e);

        await vi.advanceTimersByTimeAsync(10_000);

        expect(await settled).toBeUndefined();
        expect(log.filter(l => l.url === 'https://battery.test/message')).toHaveLength(1);
    });

    it('gives up after repeated pending rejections', async () => {
        const { api, log } = makeRoutedApi({ seqno: () => 5 });
        const battery = makeBatteryAccess(log, undefined, () => PENDING_MESSAGES);

        const settled = executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(5, true)], 'battery'),
            feeMethod: 'battery',
            battery,
            signer: SIGNER
        }).catch(e => e);

        await vi.advanceTimersByTimeAsync(60_000);

        const error = await settled;
        expect(error).toBeInstanceOf(MigrationExecutionError);
        expect(error.details).toEqual({
            status: 400,
            errorKey: 'err-gasless-pending-messages',
            viaBattery: true
        });
        expect(log.filter(l => l.url === 'https://battery.test/message')).toHaveLength(5);
    });

    it("reports the relay's own error instead of the generated client's", async () => {
        const { api, log } = makeRoutedApi({ seqno: () => 5 });
        const battery = makeBatteryAccess(log, undefined, () => ({
            status: 500,
            body: { error: 'failed to emulate: to many iterations: 100/100' }
        }));

        const settled = executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(5, true)], 'battery'),
            feeMethod: 'battery',
            battery,
            signer: SIGNER
        }).catch(e => e);

        await vi.advanceTimersByTimeAsync(5_000);

        const error = await settled;
        expect(error).toBeInstanceOf(MigrationExecutionError);
        expect(error.message).toBe('failed to emulate: to many iterations: 100/100');
        expect(error.details).toEqual({ status: 500, errorKey: undefined, viaBattery: true });
        expect(log.filter(l => l.url === 'https://battery.test/message')).toHaveLength(1);
    });

    it('refuses a sponsored batch without Battery access', async () => {
        const { api, log } = makeRoutedApi({ seqno: () => 5 });

        const error = await executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([makeTransaction(5, true)], 'battery'),
            feeMethod: 'battery',
            signer: SIGNER
        }).catch(e => e);

        expect(error).toBeInstanceOf(MigrationExecutionError);
        expect(error.part).toBe('setup');
        expect(log).toHaveLength(0);
    });

    it('rejects the whole batch before sending anything when a message pays another address', async () => {
        const { api, log } = makeRoutedApi({ seqno: () => 10 });

        const error = await executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: makePrepared([
                makeTransaction(10),
                makeTransaction(11, false, '0:' + 'e'.repeat(64))
            ]),
            feeMethod: 'ton',
            signer: SIGNER
        }).catch(e => e);

        expect(error).toBeInstanceOf(MigrationExecutionError);
        expect(error.part).toBe('setup');
        expect(error.isPartial).toBe(false);
        expect(log.filter(l => l.url.includes('/v2/blockchain/message'))).toHaveLength(0);
    });

    it('throws a setup error when there is nothing to send', async () => {
        const { api } = makeRoutedApi({ seqno: () => 0 });

        const error = await executeMigration({
            api,
            sourceWallet: WALLET,
            prepared: { ton: {}, tron: emptyMigrationTronPlan(), errors: {} },
            feeMethod: 'ton',
            signer: SIGNER
        }).catch(e => e);

        expect(error).toBeInstanceOf(MigrationExecutionError);
        expect(error.part).toBe('setup');
        expect(error.isPartial).toBe(false);
    });
});

describe('loadMigratableWalletValues', () => {
    it('merges backend values with TRON balances and drops empty wallets', async () => {
        const addressA = '0:' + 'a'.repeat(64);
        const addressB = '0:' + 'b'.repeat(64);
        const addressC = '0:' + 'e'.repeat(64);
        const fetchImpl = vi.fn(async () => {
            const body = {
                wallets: [
                    {
                        account: addressA,
                        balance: 5_000_000_000,
                        status: 'active',
                        jettons: [],
                        nft_count: 2
                    },
                    { account: addressB, balance: 0, status: 'uninit', jettons: [], nft_count: 0 }
                ]
            };
            return {
                ok: true,
                status: 200,
                json: async () => body,
                text: async () => JSON.stringify(body)
            } as Response;
        }) as unknown as typeof fetch;
        const api = {
            tonApiV2: new Configuration({ basePath: 'https://tonapi.test', fetchApi: fetchImpl })
        };
        const tronApi = {
            getBalancesBatch: vi.fn(async () => new Map()),
            getBalances: vi.fn(async (address: string) => {
                if (address === 'TDustOnly') {
                    return { trx: '100000', usdt: '0' };
                }
                return { trx: '0', usdt: '5000000' };
            })
        } as unknown as TronApi;

        const values = await loadMigratableWalletValues({
            api,
            tronApi,
            currency: 'USD',
            candidates: [
                { id: 'A', tonAddress: addressA },
                { id: 'B', tonAddress: addressB, tronAddress: 'TDustOnly' },
                { id: 'C', tonAddress: addressC, tronAddress: 'TUsdtHolder' }
            ]
        });

        expect(values.map(v => v.id)).toEqual(['A', 'C']);

        const a = values.find(v => v.id === 'A')!;
        expect(a.hasTonAssets).toBe(true);
        expect(a.initialized).toBe(true);
        expect(a.nftCount).toBe(2);
        expect(a.hasTronAssets).toBe(false);

        // B: no TON assets and its 0.1 TRX is dust — dropped entirely.

        const c = values.find(v => v.id === 'C')!;
        expect(c.hasTonAssets).toBe(false);
        expect(c.initialized).toBe(false);
        expect(c.hasTronAssets).toBe(true);
        expect(c.tronUsdt.toFixed()).toBe('5000000');
    });
});

describe('loadMigrationTronBalances', () => {
    it('batches unique addresses and loads only what the batch left unanswered', async () => {
        const tronApi = {
            getBalancesBatch: vi.fn(async () => new Map([['TBatchA', { trx: '1', usdt: '2' }]])),
            getBalances: vi.fn(async () => ({ trx: '3', usdt: '4' }))
        } as unknown as TronApi;

        const balances = await loadMigrationTronBalances(tronApi, [
            'TBatchA',
            'TBatchA',
            'TBatchB'
        ]);

        expect(tronApi.getBalancesBatch).toHaveBeenCalledWith(['TBatchA', 'TBatchB']);
        expect(tronApi.getBalances).toHaveBeenCalledTimes(1);
        expect(tronApi.getBalances).toHaveBeenCalledWith('TBatchB');
        expect(balances.get('TBatchA')).toEqual({ trx: '1', usdt: '2' });
        expect(balances.get('TBatchB')).toEqual({ trx: '3', usdt: '4' });
    });

    it('leaves out an address TronGrid never answered instead of zeroing it', async () => {
        const tronApi = {
            getBalancesBatch: vi.fn(async () => {
                throw new Error('429');
            }),
            getBalances: vi.fn(async () => {
                throw new Error('429');
            })
        } as unknown as TronApi;

        const balances = await loadMigrationTronBalances(tronApi, ['TNeverAnswered']);

        expect(balances.has('TNeverAnswered')).toBe(false);
    });

    it('serves a fresh balance from cache and keeps the last known one when a refresh fails', async () => {
        const seeding = {
            getBalancesBatch: vi.fn(async () => new Map([['TCached', { trx: '5', usdt: '6' }]])),
            getBalances: vi.fn()
        } as unknown as TronApi;
        await loadMigrationTronBalances(seeding, ['TCached']);

        const cachedRead = {
            getBalancesBatch: vi.fn(),
            getBalances: vi.fn()
        } as unknown as TronApi;
        const cached = await loadMigrationTronBalances(cachedRead, ['TCached']);
        expect(cachedRead.getBalancesBatch).not.toHaveBeenCalled();
        expect(cached.get('TCached')).toEqual({ trx: '5', usdt: '6' });

        vi.useFakeTimers();
        try {
            vi.setSystemTime(Date.now() + 61_000);
            const failing = {
                getBalancesBatch: vi.fn(async () => {
                    throw new Error('429');
                }),
                getBalances: vi.fn(async () => {
                    throw new Error('429');
                })
            } as unknown as TronApi;
            const stale = await loadMigrationTronBalances(failing, ['TCached']);
            expect(failing.getBalances).toHaveBeenCalledWith('TCached');
            expect(stale.get('TCached')).toEqual({ trx: '5', usdt: '6' });
        } finally {
            vi.useRealTimers();
        }
    });
});
