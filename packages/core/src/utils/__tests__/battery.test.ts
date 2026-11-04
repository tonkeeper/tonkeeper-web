/* eslint-disable import/no-extraneous-dependencies */
import BigNumber from 'bignumber.js';
import { describe, expect, it } from 'vitest';
import { getBatteryLevel } from '../battery';

describe('getBatteryLevel', () => {
    it('flags a refunded-below-zero balance as negative rather than empty', () => {
        expect(getBatteryLevel(new BigNumber('-0.3'))).toBe('negative');
        expect(getBatteryLevel(new BigNumber(0))).toBe('empty');
    });

    it('picks the level nearest to the fill against the full-battery balance', () => {
        expect(getBatteryLevel(new BigNumber('0.1'))).toBe(10);
        expect(getBatteryLevel(new BigNumber('0.69'))).toBe(10);
        expect(getBatteryLevel(new BigNumber('0.7'))).toBe(25);
        // 455 charges at 0.0026 TON: ~30% full, drawn as a quarter like iOS.
        expect(getBatteryLevel(new BigNumber('1.183'))).toBe(25);
        expect(getBatteryLevel(new BigNumber('1.49'))).toBe(25);
        expect(getBatteryLevel(new BigNumber('1.5'))).toBe(50);
        expect(getBatteryLevel(new BigNumber('2.5'))).toBe(75);
        expect(getBatteryLevel(new BigNumber('3.49'))).toBe(75);
        expect(getBatteryLevel(new BigNumber('3.5'))).toBe(100);
        expect(getBatteryLevel(new BigNumber('40'))).toBe(100);
    });
});
