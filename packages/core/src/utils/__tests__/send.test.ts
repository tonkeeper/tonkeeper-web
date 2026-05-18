/* eslint-disable import/no-extraneous-dependencies */
import BigNumber from 'bignumber.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Pin the locale formatters so tests don't depend on the `navigator` global,
// which is undefined in Node and would otherwise blow up `getBrowserLocale`.
vi.mock('../formatting', () => ({
    getBrowserLocale: () => 'en-US',
    getDecimalSeparator: () => '.',
    getGroupSeparator: () => ','
}));

const sendModule = await import('../send');
const {
    cropTail,
    formatNumberValue,
    formatSendValue,
    getDecimalLength,
    inputToBigNumber,
    isNumeric,
    removeGroupSeparator,
    seeIfLargeTail,
    toNumberAmount
} = sendModule;

beforeEach(() => {
    vi.clearAllMocks();
});

describe('removeGroupSeparator', () => {
    it('strips the locale group separator', () => {
        expect(removeGroupSeparator('1,234,567.89')).toBe('1234567.89');
    });

    it('leaves strings without separators alone', () => {
        expect(removeGroupSeparator('1234.56')).toBe('1234.56');
    });
});

describe('toNumberAmount', () => {
    it('parses a dot-decimal float', () => {
        expect(toNumberAmount('12.5')).toBe(12.5);
    });

    it('normalises a comma decimal to a dot before parsing', () => {
        expect(toNumberAmount('12,5')).toBe(12.5);
    });
});

describe('isNumeric', () => {
    const cases: Array<{ input: string; expected: boolean; label: string }> = [
        { input: '0', expected: true, label: 'zero' },
        { input: '123', expected: true, label: 'integer' },
        { input: '0.1', expected: true, label: 'decimal' },
        { input: '1,234.56', expected: true, label: 'grouped decimal' },
        { input: '  42  ', expected: true, label: 'trims whitespace' },
        { input: '', expected: false, label: 'empty' },
        { input: 'abc', expected: false, label: 'letters' },
        // Only the first two split parts are inspected, so "1.2.3" passes —
        // documenting current behaviour, not endorsing it.
        { input: '1.2.3', expected: true, label: 'parser only inspects first two split parts' },
        { input: '1.', expected: true, label: 'trailing decimal (no tail)' },
        { input: '.5', expected: false, label: 'leading decimal (no entry)' },
        { input: '-1', expected: false, label: 'negative (signs not parsed)' }
    ];

    for (const { input, expected, label } of cases) {
        it(`returns ${expected} for ${label} (${JSON.stringify(input)})`, () => {
            expect(isNumeric(input)).toBe(expected);
        });
    }
});

describe('seeIfLargeTail', () => {
    it('returns true when the fractional part exceeds the decimal limit', () => {
        expect(seeIfLargeTail('1.123456789', 9)).toBe(false);
        expect(seeIfLargeTail('1.1234567890', 9)).toBe(true);
    });

    it('returns false when there is no fractional part', () => {
        expect(seeIfLargeTail('100', 9)).toBe(false);
    });

    it('counts the tail of grouped numbers correctly', () => {
        expect(seeIfLargeTail('1,000.123', 2)).toBe(true);
        expect(seeIfLargeTail('1,000.12', 2)).toBe(false);
    });
});

describe('getDecimalLength', () => {
    it('returns zero when there is no fractional part', () => {
        expect(getDecimalLength('100')).toBe(0);
    });

    it('returns the count of fractional digits', () => {
        expect(getDecimalLength('1.123')).toBe(3);
        expect(getDecimalLength('0.000000001')).toBe(9);
    });

    it('ignores group separators', () => {
        expect(getDecimalLength('1,000.55')).toBe(2);
    });
});

describe('cropTail', () => {
    it('crops the fractional part to the decimal limit', () => {
        expect(cropTail('1.123456789012', 9)).toBe('1.123456789');
    });

    it('leaves values within the limit unchanged', () => {
        expect(cropTail('1.5', 9)).toBe('1.5');
    });

    it('drops the fractional part entirely when limit is zero', () => {
        expect(cropTail('1.5', 0)).toBe('1');
    });
});

describe('formatSendValue', () => {
    it('reapplies the group separator to large integers', () => {
        expect(formatSendValue('1234567')).toBe('1,234,567');
    });

    it('preserves the fractional part as-is', () => {
        expect(formatSendValue('1234567.890')).toBe('1,234,567.890');
    });

    it('strips an existing group separator before re-grouping', () => {
        expect(formatSendValue('1,234,567.89')).toBe('1,234,567.89');
    });
});

describe('inputToBigNumber', () => {
    it('parses a plain decimal string', () => {
        expect(inputToBigNumber('1234.56').toString()).toBe('1234.56');
    });

    it('strips the locale group separator before parsing', () => {
        expect(inputToBigNumber('1,234,567.89').toString()).toBe('1234567.89');
    });

    it('falls back to zero for an empty string', () => {
        expect(inputToBigNumber('').toString()).toBe('0');
    });
});

describe('formatNumberValue', () => {
    it('formats a BigNumber with grouping and the locale decimal separator', () => {
        expect(formatNumberValue(new BigNumber('1234567.89'))).toBe('1,234,567.89');
    });

    it('drops the decimal when the BigNumber is an integer', () => {
        expect(formatNumberValue(new BigNumber('1000'))).toBe('1,000');
    });
});
