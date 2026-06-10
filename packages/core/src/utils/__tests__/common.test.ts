/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { hideSensitiveData, toShortValue } from '../common';

describe('toShortValue', () => {
    it('returns the original value when shorter than twice the window', () => {
        expect(toShortValue('abc')).toBe('abc');
        expect(toShortValue('12345678')).toBe('12345678');
    });

    it('elides the middle with an ellipsis when longer', () => {
        expect(toShortValue('abcdefghij')).toBe('abcd…ghij');
    });

    it('respects a custom chunk size', () => {
        expect(toShortValue('abcdefghij', 2)).toBe('ab…ij');
    });
});

describe('hideSensitiveData', () => {
    const seed12 = 'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12';
    const seed24 =
        'word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12 ' +
        'word13 word14 word15 word16 word17 word18 word19 word20 word21 word22 word23 word24';

    it('redacts a 24-word mnemonic', () => {
        const out = hideSensitiveData(`my seed is: ${seed24}`);
        expect(out).toContain('##SensitiveData##');
        expect(out).not.toContain('word24');
    });

    it('redacts a 12-word mnemonic', () => {
        const out = hideSensitiveData(`leaked: ${seed12} end`);
        expect(out).toContain('##SensitiveData##');
        expect(out).not.toContain('word12');
    });

    it('redacts a comma-separated 24-word mnemonic', () => {
        const csv = seed24.split(' ').join(', ');
        const out = hideSensitiveData(`json: ${csv}`);
        expect(out).toContain('##SensitiveData##');
        expect(out).not.toContain('word24');
    });

    it('leaves benign text untouched', () => {
        const benign = 'nothing to redact here';
        expect(hideSensitiveData(benign)).toBe(benign);
    });
});
