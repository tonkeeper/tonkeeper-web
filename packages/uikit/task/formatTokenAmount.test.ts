import BigNumber from 'bignumber.js';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { getDecimalSeparator, getGroupSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { describe, expect, it } from 'vitest';
import { formatDisplayAmount } from '../src/libs/formatDisplayAmount';
import { formatTokenAmount } from '../src/libs/formatTokenAmount';

const defaultOptions = {
    groupSeparator: ' ',
    decimalSeparator: '.'
} as const;

describe('formatTokenAmount', () => {
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
            const actual = formatTokenAmount(input, 'TON', defaultOptions);
            expect(actual, `Unexpected result for ${input}`).toBe(expected);
        }
    });

    it('supports custom separators', () => {
        expect(
            formatTokenAmount('10.5', 'TON', {
                groupSeparator: '.',
                decimalSeparator: ','
            })
        ).toBe('10,5 TON');
    });

    it('supports rendering without unit', () => {
        expect(
            formatTokenAmount('1234.56', 'TON', {
                groupSeparator: ',',
                decimalSeparator: '.',
                withUnit: false
            })
        ).toBe('1,234');
    });

    it('keeps sign for negative values', () => {
        expect(formatTokenAmount('-10.0998', 'TON', defaultOptions)).toBe('-10.09 TON');
    });

    it('returns zero for non-finite values', () => {
        expect(formatTokenAmount('NaN', 'TON', defaultOptions)).toBe('0 TON');
    });

    it('keeps behavior identical to shared formatter', () => {
        expect(formatTokenAmount('10.0998', 'TON')).toBe(
            formatDisplayAmount({ kind: 'token', amount: '10.0998', unit: 'TON' })
        );
    });

    it('accepts BigNumber values', () => {
        expect(formatTokenAmount(new BigNumber('9.99423'), 'TON', defaultOptions)).toBe('9.99 TON');
    });
});

describe('formatDisplayAmount (fiat)', () => {
    const decimal = getDecimalSeparator();
    const group = getGroupSeparator();

    const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

    it('formats fiat with default profile', () => {
        const value = formatDisplayAmount({
            kind: 'fiat',
            amount: '1234.567',
            currency: FiatCurrencies.USD,
            profile: 'default'
        });

        expect(normalizeWhitespace(value)).toBe(`$ 1${group}234${decimal}56`);
    });

    it('formats fiat with significant profile', () => {
        expect(
            formatDisplayAmount({
                kind: 'fiat',
                amount: '0.000143945',
                currency: FiatCurrencies.USD,
                profile: 'significant',
                withUnit: false
            })
        ).toBe(`0${decimal}000143`);
    });

    it('formats currencies with postfix symbol', () => {
        const value = formatDisplayAmount({
            kind: 'fiat',
            amount: '10.5',
            currency: FiatCurrencies.RUB,
            profile: 'default'
        });

        expect(normalizeWhitespace(value)).toBe(`10${decimal}50 ₽`);
    });

    it('returns zero for non-finite fiat values', () => {
        expect(
            formatDisplayAmount({
                kind: 'fiat',
                amount: 'NaN',
                currency: FiatCurrencies.USD,
                profile: 'default',
                withUnit: false
            })
        ).toBe('0');
    });
});
