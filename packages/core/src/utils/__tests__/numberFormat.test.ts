/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it } from 'vitest';
import { FiatCurrencies } from '../../entries/fiat';
import {
    formatAmount,
    formatCompact,
    formatCount,
    formatDecimal,
    formatPercent,
    fromAmountInput,
    getNumberSeparators,
    setNumberFormatLanguage,
    toAmountInput
} from '../numberFormat';

afterEach(() => setNumberFormatLanguage('en'));

describe('number format language', () => {
    it('takes separators from the app language', () => {
        setNumberFormatLanguage('en');
        expect(formatAmount('1234.5')).toBe('1,234');
        expect(formatAmount('17.79', { unit: 'USDT' })).toBe('17.79 USDT');

        setNumberFormatLanguage('ru');
        expect(formatAmount('17.79', { unit: 'USDT' })).toBe('17,79 USDT');
        expect(getNumberSeparators().decimalSeparator).toBe(',');

        setNumberFormatLanguage('de');
        expect(formatAmount('12345.6')).toBe('12.345');
    });

    it('keeps Latin digits where the locale defaults to native ones', () => {
        for (const language of ['ar', 'fa', 'bn']) {
            setNumberFormatLanguage(language);
            expect(formatAmount('1.5')).toMatch(/^1\D5$/);
            expect(formatCompact('3652000000')).toMatch(/[0-9]/);
        }
    });

    it('falls back to English for an unknown language', () => {
        setNumberFormatLanguage('not a locale');
        expect(formatAmount('1.5')).toBe('1.5');
    });
});

describe('formatAmount', () => {
    it('drops the padding zeros a significant-digit formatter would add', () => {
        expect(formatAmount('17.79', { unit: 'USDT' })).toBe('17.79 USDT');
        expect(formatAmount('953.1', { unit: 'USDT' })).toBe('953.1 USDT');
    });

    it('never switches to exponent notation', () => {
        expect(formatAmount('110000', { unit: 'USD' })).toBe('110,000 USD');
        expect(formatAmount('0.0000105', { unit: 'BTC' })).toBe('0.0000105 BTC');
    });

    it('keeps every decimal when exact', () => {
        expect(formatAmount('18.461248', { unit: 'TRX', exact: true })).toBe('18.461248 TRX');
        expect(formatAmount('18.461248', { unit: 'TRX' })).toBe('18.46 TRX');
    });

    it('accepts bigint and fiat currencies', () => {
        expect(formatAmount(1500n)).toBe('1,500');
        expect(formatAmount('3.5', { currency: FiatCurrencies.USD })).toBe('$ 3.5');
    });
});

describe('formatDecimal and formatPercent', () => {
    it('rounds to two decimals and trims trailing zeros', () => {
        expect(formatDecimal('4.5')).toBe('4.5');
        expect(formatDecimal('4.567')).toBe('4.57');
        expect(formatDecimal('1.20')).toBe('1.2');
    });

    it('signs only on request', () => {
        expect(formatPercent(0.5)).toBe('0.5%');
        expect(formatPercent(1.25, { signed: true })).toBe('+1.25%');
        expect(formatPercent(-3, { signed: true })).toBe('-3%');
        expect(formatPercent(0, { signed: true })).toBe('0%');
    });

    it('uses the language decimal separator', () => {
        setNumberFormatLanguage('ru');
        expect(formatPercent(6.12)).toBe('6,12%');
    });
});

describe('formatCompact and formatCount', () => {
    it('abbreviates large magnitudes', () => {
        expect(formatCompact('3652000000')).toBe('3.65B');
        expect(formatCompact('115401.700525', { currency: FiatCurrencies.USD })).toBe('$ 115.4K');
        expect(formatCompact(undefined as unknown as string)).toBe('');
    });

    it('groups whole numbers and drops fractions', () => {
        expect(formatCount(12345)).toBe('12,345');
        expect(formatCount('807.9')).toBe('807');
    });
});

describe('amount input text', () => {
    it('shows the language separator and reads either one back', () => {
        setNumberFormatLanguage('ru');
        expect(toAmountInput('0.101867255')).toBe('0,101867255');
        expect(fromAmountInput('0,10')).toBe('0.10');
        expect(fromAmountInput('0.10')).toBe('0.10');

        setNumberFormatLanguage('en');
        expect(toAmountInput('0.5')).toBe('0.5');
        expect(fromAmountInput('0,5')).toBe('0.5');
    });
});
