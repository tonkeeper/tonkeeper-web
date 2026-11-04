/* eslint-disable import/no-extraneous-dependencies */
import BigNumber from 'bignumber.js';
import { describe, expect, it } from 'vitest';

import { migrationFeeAsset, resolveMigrationFeePlan } from '../migration/migrationFeePlan';
import { MigrationTonVariant, PreparedMigration } from '../migration/migrationService';
import { emptyMigrationTronPlan } from '../migration/migrationTronService';

const UNIT_TON_RATE = new BigNumber(0.01);

const tonVariant = (gasPayer: 'ton' | 'battery'): MigrationTonVariant =>
    ({
        gasPayer,
        prepared: { insufficientFunds: false, result: { transactions: [{}] } },
        verified: [],
        totalGasSpent: new BigNumber(gasPayer === 'ton' ? 50_000_000 : 0),
        // 0.1 TON at 0.01 TON per charge
        sponsoredGasSpent: new BigNumber(gasPayer === 'battery' ? 100_000_000 : 0)
    } as unknown as MigrationTonVariant);

const TON_CHARGES = 10;
const TRON_CHARGES = 30;

const prepared = (tron: Partial<PreparedMigration['tron']> = {}): PreparedMigration => ({
    ton: { self: tonVariant('ton'), battery: tonVariant('battery') },
    tron: {
        ...emptyMigrationTronPlan('TFrom', 'TTo'),
        usdtAmount: new BigNumber(5_000_000),
        migratableTrx: new BigNumber(10_000_000),
        requiredTrxForUsdt: new BigNumber(7_000_000),
        requiredTrxForSweep: new BigNumber(300_000),
        trxSweepAmount: new BigNumber(2_700_000),
        usdtBatteryCharges: TRON_CHARGES,
        ...tron
    },
    errors: {}
});

const resolve = (
    migration: PreparedMigration,
    availableCharges: number | undefined,
    methods: Parameters<typeof resolveMigrationFeePlan>[1] = {}
) => resolveMigrationFeePlan(migration, methods, { unitTonRate: UNIT_TON_RATE, availableCharges })!;

describe('resolveMigrationFeePlan', () => {
    it('defaults both legs to Battery when the balance covers both', () => {
        const plan = resolve(prepared(), TON_CHARGES + TRON_CHARGES);

        expect(plan.method).toBe('battery');
        expect(plan.tron.method).toBe('battery');
        expect(plan.tron.batteryCharges?.required).toBe(TRON_CHARGES);
        expect(plan.execution).toBe('ready');
    });

    it('settles the TON leg first when the balance covers one leg only', () => {
        const plan = resolve(prepared(), TON_CHARGES + TRON_CHARGES - 1);

        expect(plan.method).toBe('battery');
        expect(plan.tron.method).toBe('trx');
        expect(plan.tron.batteryPayable).toBe(false);
    });

    it('leaves the TON leg to its coin when the TRON leg already claims the charges', () => {
        const plan = resolve(prepared(), TRON_CHARGES, { tron: 'battery' });

        expect(plan.tron.method).toBe('battery');
        expect(plan.method).toBe('ton');
        expect(plan.batteryPayable).toBe(false);
    });

    it('lets Battery carry a USDT transfer the TRX balance cannot', () => {
        const poor = prepared({
            migratableTrx: new BigNumber(0),
            trxSweepAmount: new BigNumber(0)
        });

        expect(resolve(poor, 0).execution).toBe('ton-only');

        const plan = resolve(poor, TON_CHARGES + TRON_CHARGES);
        expect(plan.tron.method).toBe('battery');
        expect(plan.execution).toBe('ready');
    });

    it('sweeps the TRX the USDT burn would have taken under Battery', () => {
        const plan = resolve(prepared(), TON_CHARGES + TRON_CHARGES);

        expect(plan.tron.plan.requiredTrxForUsdt.toFixed()).toBe('0');
        expect(plan.tron.plan.trxSweepAmount.toFixed()).toBe('9700000');
    });

    it('never defaults to Battery before the balance is read', () => {
        const plan = resolve(prepared(), undefined);

        expect(plan.method).toBe('ton');
        expect(plan.tron.method).toBe('trx');
        expect(plan.pending).toBe(false);
    });

    it('holds a Battery picked before the balance is read as pending', () => {
        const poor = prepared({
            migratableTrx: new BigNumber(0),
            trxSweepAmount: new BigNumber(0)
        });
        const plan = resolve(poor, undefined, { tron: 'battery' });

        expect(plan.tron.method).toBe('battery');
        expect(plan.pending).toBe(true);
        expect(plan.execution).toBe('ready');
    });

    it('drops a picked Battery once the balance proves it unaffordable', () => {
        const plan = resolve(prepared(), TON_CHARGES - 1, { ton: 'battery', tron: 'battery' });

        expect(plan.method).toBe('ton');
        expect(plan.tron.method).toBe('trx');
        expect(plan.pending).toBe(false);
    });

    it('offers no TRON Battery without a relay quote', () => {
        const plan = resolve(prepared({ usdtBatteryCharges: undefined }), 1_000);

        expect(plan.tron.batteryCharges).toBeUndefined();
        expect(plan.tron.method).toBe('trx');
    });
});

describe('migrationFeeAsset', () => {
    it('reports Battery when any running leg spends charges', () => {
        expect(migrationFeeAsset(resolve(prepared(), TON_CHARGES))).toBe('battery_charges');
        expect(migrationFeeAsset(resolve(prepared(), TON_CHARGES + TRON_CHARGES))).toBe(
            'battery_charges'
        );
        expect(migrationFeeAsset(resolve(prepared(), 0))).toBe('coin');
    });

    it('falls back to the TON leg when the TRON leg is skipped', () => {
        const poor = prepared({
            migratableTrx: new BigNumber(0),
            trxSweepAmount: new BigNumber(0)
        });
        expect(migrationFeeAsset(resolve(poor, TON_CHARGES))).toBe('battery_charges');
    });
});
