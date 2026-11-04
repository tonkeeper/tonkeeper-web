/* eslint-disable import/no-extraneous-dependencies */
import BigNumber from 'bignumber.js';
import { describe, expect, it } from 'vitest';

import {
    bufferedNativeTrxFeeSun,
    emptyMigrationTronPlan,
    hasTronTransfers,
    MIGRATION_TRX_DUST_THRESHOLD_SUN,
    tronFeeShortage,
    tronPlanForFeeMethod,
    withoutMigrationDust
} from '../migration/migrationTronService';

describe('withoutMigrationDust', () => {
    it('zeroes balances below 0.25 TRX', () => {
        expect(withoutMigrationDust(new BigNumber(249_999)).toFixed()).toBe('0');
        expect(withoutMigrationDust(new BigNumber(1)).toFixed()).toBe('0');
        expect(withoutMigrationDust(new BigNumber(0)).toFixed()).toBe('0');
    });

    it('keeps balances at or above the threshold', () => {
        expect(withoutMigrationDust(MIGRATION_TRX_DUST_THRESHOLD_SUN).toFixed()).toBe('250000');
        expect(withoutMigrationDust(new BigNumber(1_000_000)).toFixed()).toBe('1000000');
    });
});

describe('bufferedNativeTrxFeeSun', () => {
    it('reserves at least 0.1 TRX above small fees', () => {
        // max(0 * 1.5, 0 + 100000)
        expect(bufferedNativeTrxFeeSun(new BigNumber(0)).toFixed()).toBe('100000');
        // max(75000, 150000)
        expect(bufferedNativeTrxFeeSun(new BigNumber(50_000)).toFixed()).toBe('150000');
    });

    it('reserves 1.5x for large fees', () => {
        // max(1.5M, 1.1M)
        expect(bufferedNativeTrxFeeSun(new BigNumber(1_000_000)).toFixed()).toBe('1500000');
    });
});

describe('plan predicates', () => {
    it('an empty plan has no transfers', () => {
        expect(hasTronTransfers(emptyMigrationTronPlan('TFrom', 'TTo'))).toBe(false);
    });

    it('detects transfers on either leg', () => {
        const usdtOnly = {
            ...emptyMigrationTronPlan('TFrom', 'TTo'),
            usdtAmount: new BigNumber(1)
        };
        const sweepOnly = {
            ...emptyMigrationTronPlan('TFrom', 'TTo'),
            trxSweepAmount: new BigNumber(1)
        };
        expect(hasTronTransfers(usdtOnly)).toBe(true);
        expect(hasTronTransfers(sweepOnly)).toBe(true);
    });

    it('reports a fee shortage only when USDT cannot cover its TRX burn', () => {
        const base = emptyMigrationTronPlan('TFrom', 'TTo');
        expect(
            tronFeeShortage({
                ...base,
                usdtAmount: new BigNumber(1_000_000),
                requiredTrxForUsdt: new BigNumber(27_000_000),
                migratableTrx: new BigNumber(1_000_000)
            })
        ).toBe(true);
        expect(
            tronFeeShortage({
                ...base,
                usdtAmount: new BigNumber(1_000_000),
                requiredTrxForUsdt: new BigNumber(27_000_000),
                migratableTrx: new BigNumber(30_000_000)
            })
        ).toBe(false);
        // No USDT leg — nothing needs a TRX fee upfront.
        expect(
            tronFeeShortage({
                ...base,
                requiredTrxForUsdt: new BigNumber(27_000_000),
                migratableTrx: new BigNumber(0)
            })
        ).toBe(false);
    });
});

describe('tronPlanForFeeMethod', () => {
    const plan = {
        ...emptyMigrationTronPlan('TFrom', 'TTo'),
        usdtAmount: new BigNumber(5_000_000),
        migratableTrx: new BigNumber(10_000_000),
        requiredTrxForUsdt: new BigNumber(7_000_000),
        requiredTrxForSweep: new BigNumber(300_000),
        trxSweepAmount: new BigNumber(2_700_000),
        usdtBatteryCharges: 40
    };

    it('leaves a TRX-paid plan as prepared', () => {
        expect(tronPlanForFeeMethod(plan, 'trx')).toBe(plan);
    });

    it('drops the USDT burn and sweeps the TRX it would have cost under Battery', () => {
        const battery = tronPlanForFeeMethod(plan, 'battery');
        expect(battery.requiredTrxForUsdt.toFixed()).toBe('0');
        expect(battery.trxSweepAmount.toFixed()).toBe('9700000');
        expect(tronFeeShortage(battery)).toBe(false);
    });

    it('never reports a shortage when Battery pays a USDT transfer the TRX cannot', () => {
        const poor = { ...plan, migratableTrx: new BigNumber(0), trxSweepAmount: new BigNumber(0) };
        expect(tronFeeShortage(poor)).toBe(true);
        const battery = tronPlanForFeeMethod(poor, 'battery');
        expect(tronFeeShortage(battery)).toBe(false);
        expect(battery.trxSweepAmount.toFixed()).toBe('0');
        expect(hasTronTransfers(battery)).toBe(true);
    });

    it('has nothing to sponsor without USDT', () => {
        const trxOnly = { ...plan, usdtAmount: new BigNumber(0) };
        expect(tronPlanForFeeMethod(trxOnly, 'battery')).toBe(trxOnly);
    });
});
