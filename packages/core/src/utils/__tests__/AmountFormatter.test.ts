/* eslint-disable import/no-extraneous-dependencies */
import BigNumber from 'bignumber.js';
import { FiatCurrencies } from '../../entries/fiat';
import { AmountFormatter } from '../AmountFormatter';
import { describe, expect, it } from 'vitest';

const formatter = new AmountFormatter({
    getLocaleFormat: () => ({
        decimalSeparator: '.',
        groupingSeparator: ' '
    })
});

describe('AmountFormatter.formatDisplay (token)', () => {
    const cases: Array<{ input: string; expected: string }> = [
        { input: '33000.999', expected: '33 000 TON' },
        { input: '1000.90932', expected: '1 000 TON' },
        { input: '99.999999940005', expected: '99.99 TON' },
        { input: '10.00932', expected: '10 TON' },
        { input: '10.0998', expected: '10.09 TON' },
        { input: '9.99423', expected: '9.99 TON' },
        { input: '1.0099', expected: '1 TON' },
        { input: '1.0965', expected: '1.09 TON' },
        { input: '1.8051', expected: '1.8 TON' },
        { input: '0.000143945', expected: '0.000143 TON' },
        { input: '0.00100099', expected: '0.001 TON' },
        { input: '0.00000099992', expected: '0.000000999 TON' },
        { input: '1000', expected: '1 000 TON' },
        { input: '1', expected: '1 TON' },
        { input: '0.9999', expected: '0.999 TON' },
        { input: '0', expected: '0 TON' }
    ];

    it('applies spec rules for boundaries and truncation', () => {
        for (const { input, expected } of cases) {
            const actual = formatter.formatDisplay(input, { unit: 'TON' });
            expect(actual, `Unexpected result for ${input}`).toBe(expected);
        }
    });

    it('formats without unit', () => {
        expect(formatter.formatDisplay('1234.56')).toBe('1 234');
    });

    it('keeps sign for negative values', () => {
        expect(formatter.formatDisplay('-10.0998', { unit: 'TON' })).toBe('-10.09 TON');
    });

    it('returns zero for non-finite values', () => {
        expect(formatter.formatDisplay('NaN', { unit: 'TON' })).toBe('0 TON');
    });

    it('accepts BigNumber values', () => {
        expect(formatter.formatDisplay(new BigNumber('9.99423'), { unit: 'TON' })).toBe('9.99 TON');
    });
});

describe('AmountFormatter.formatDisplay (custom separators)', () => {
    const dotComma = new AmountFormatter({
        getLocaleFormat: () => ({
            decimalSeparator: ',',
            groupingSeparator: '.'
        })
    });

    it('uses custom separators', () => {
        expect(dotComma.formatDisplay('10.5', { unit: 'TON' })).toBe('10,5 TON');
    });

    it('groups integer part with custom separator', () => {
        expect(dotComma.formatDisplay('1234567')).toBe('1.234.567');
    });
});

describe('AmountFormatter.formatDisplay (fiat)', () => {
    it('formats USD with prefix symbol', () => {
        expect(formatter.formatDisplay('1234.567', { currency: FiatCurrencies.USD })).toBe(
            '$ 1 234'
        );
    });

    it('formats RUB with postfix symbol', () => {
        expect(formatter.formatDisplay('10.5', { currency: FiatCurrencies.RUB })).toBe('10.5 ₽');
    });

    it('formats small fiat amounts with 3 significant digits', () => {
        expect(formatter.formatDisplay('0.000143945', { currency: FiatCurrencies.USD })).toBe(
            '$ 0.000143'
        );
    });

    it('returns zero for non-finite fiat values', () => {
        expect(formatter.formatDisplay('NaN', { currency: FiatCurrencies.USD })).toBe('$ 0');
    });

    it('returns zero without currency for non-finite values', () => {
        expect(formatter.formatDisplay('NaN')).toBe('0');
    });
});
