/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';
import { Address, Cell, SendMode } from '@ton/core';
import {
    adaptLedgerTransactionToDevice,
    isLedgerAppVersionAtLeast,
    LedgerDeviceInfo,
    ledgerKnownJetton,
    signLedgerTransaction
} from '../known-jettons';
import type { LedgerTransaction } from '../connector';

const USDT = Address.parse('EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs');
const DOGS = Address.parse('EQCvxJy4eG8hyHBFsZ7eePxrRsUQSFE_jpptRAYBmcG_DOGS');
const TGBTC = Address.parse('EQBmjxpYsJ8yHEraYfTpLdejCekHMoKS2fOErP4lLHCf4SlU');
const UNKNOWN = Address.parse('0:' + '1'.repeat(64));

const modernDevice: LedgerDeviceInfo = { appVersion: '2.7.0', isNanoS: false };

const jettonTransfer = (
    knownJetton: { jettonId: number; workchain: number } | null
): LedgerTransaction => ({
    to: UNKNOWN,
    sendMode: SendMode.PAY_GAS_SEPARATELY,
    seqno: 1,
    timeout: 1_700_000_000,
    bounce: true,
    amount: 1n,
    payload: {
        type: 'jetton-transfer',
        queryId: null,
        amount: 1_000_000n,
        destination: UNKNOWN,
        responseDestination: UNKNOWN,
        customPayload: null,
        forwardAmount: 1n,
        forwardPayload: null,
        knownJetton
    }
});

const knownJettonOf = (tx: LedgerTransaction) =>
    tx.payload?.type === 'jetton-transfer' ? tx.payload.knownJetton : undefined;

describe('ledgerKnownJetton', () => {
    it('maps a master address to its device table index', () => {
        expect(ledgerKnownJetton(USDT, 0)).toEqual({ jettonId: 0, workchain: 0 });
        expect(ledgerKnownJetton(DOGS, -1)).toEqual({ jettonId: 8, workchain: -1 });
    });

    it('never hints jettons outside the device table', () => {
        expect(ledgerKnownJetton(TGBTC, 0)).toBeNull();
        expect(ledgerKnownJetton(UNKNOWN, 0)).toBeNull();
    });
});

describe('isLedgerAppVersionAtLeast', () => {
    it('compares numerically per segment', () => {
        expect(isLedgerAppVersionAtLeast('2.3.0', '2.3.0')).toBe(true);
        expect(isLedgerAppVersionAtLeast('2.10.0', '2.6.1')).toBe(true);
        expect(isLedgerAppVersionAtLeast('2.6.0', '2.6.1')).toBe(false);
        expect(isLedgerAppVersionAtLeast('2.2.9', '2.3.0')).toBe(false);
        expect(isLedgerAppVersionAtLeast('3.0.0', '2.6.1')).toBe(true);
    });
});

describe('adaptLedgerTransactionToDevice', () => {
    it('keeps the hint on a supported device', () => {
        const tx = jettonTransfer({ jettonId: 0, workchain: 0 });
        expect(adaptLedgerTransactionToDevice(tx, modernDevice)).toBe(tx);
    });

    it('drops the hint on Nano S', () => {
        const tx = jettonTransfer({ jettonId: 0, workchain: 0 });
        const adapted = adaptLedgerTransactionToDevice(tx, { ...modernDevice, isNanoS: true });
        expect(knownJettonOf(adapted)).toBeNull();
    });

    it('drops the hint below 2.3.0', () => {
        const tx = jettonTransfer({ jettonId: 0, workchain: 0 });
        const adapted = adaptLedgerTransactionToDevice(tx, { appVersion: '2.2.0', isNanoS: false });
        expect(knownJettonOf(adapted)).toBeNull();
    });

    it('requires 2.6.1 for ids 7-9 only', () => {
        const dogs = jettonTransfer({ jettonId: 8, workchain: 0 });
        const usdt = jettonTransfer({ jettonId: 0, workchain: 0 });
        const device = { appVersion: '2.6.0', isNanoS: false };
        expect(knownJettonOf(adaptLedgerTransactionToDevice(dogs, device))).toBeNull();
        expect(adaptLedgerTransactionToDevice(usdt, device)).toBe(usdt);
        expect(adaptLedgerTransactionToDevice(dogs, { appVersion: '2.6.1', isNanoS: false })).toBe(
            dogs
        );
    });

    it('leaves non-jetton transactions untouched', () => {
        const tx: LedgerTransaction = { ...jettonTransfer(null), payload: undefined };
        expect(adaptLedgerTransactionToDevice(tx, modernDevice)).toBe(tx);
    });
});

describe('signLedgerTransaction', () => {
    const signed = Cell.EMPTY;

    it('retries without the hint when the device fails to parse it', async () => {
        const signTransaction = vi
            .fn()
            .mockRejectedValueOnce(Object.assign(new Error('parse'), { statusCode: 0xb010 }))
            .mockResolvedValueOnce(signed);

        const result = await signLedgerTransaction(
            { signTransaction },
            [44, 607],
            jettonTransfer({ jettonId: 0, workchain: 0 }),
            modernDevice
        );

        expect(result).toBe(signed);
        expect(signTransaction).toHaveBeenCalledTimes(2);
        expect(knownJettonOf(signTransaction.mock.calls[0][1])).toEqual({
            jettonId: 0,
            workchain: 0
        });
        expect(knownJettonOf(signTransaction.mock.calls[1][1])).toBeNull();
    });

    it('does not retry other device errors', async () => {
        const rejection = Object.assign(new Error('denied'), { statusCode: 0x6985 });
        const signTransaction = vi.fn().mockRejectedValue(rejection);

        await expect(
            signLedgerTransaction(
                { signTransaction },
                [44, 607],
                jettonTransfer({ jettonId: 0, workchain: 0 }),
                modernDevice
            )
        ).rejects.toBe(rejection);
        expect(signTransaction).toHaveBeenCalledTimes(1);
    });

    it('does not retry a transfer that carried no hint', async () => {
        const rejection = Object.assign(new Error('parse'), { statusCode: 0xb010 });
        const signTransaction = vi.fn().mockRejectedValue(rejection);

        await expect(
            signLedgerTransaction(
                { signTransaction },
                [44, 607],
                jettonTransfer(null),
                modernDevice
            )
        ).rejects.toBe(rejection);
        expect(signTransaction).toHaveBeenCalledTimes(1);
    });
});
