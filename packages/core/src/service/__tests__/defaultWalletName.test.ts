/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { suggestWalletName } from '../defaultWalletName';

describe('suggestWalletName', () => {
    it('returns the plain base for the first wallet', () => {
        expect(suggestWalletName('Wallet', [])).toBe('Wallet');
    });

    it('counts an exact match as index 1', () => {
        expect(suggestWalletName('Wallet', ['Wallet'])).toBe('Wallet 2');
    });

    it('matches the base case-insensitively', () => {
        expect(suggestWalletName('Wallet', ['wallet'])).toBe('Wallet 2');
        expect(suggestWalletName('Wallet', ['WALLET 3'])).toBe('Wallet 4');
    });

    it('continues from the highest index without reusing freed ones', () => {
        expect(suggestWalletName('Wallet', ['Wallet', 'Wallet 5'])).toBe('Wallet 6');
        expect(suggestWalletName('Wallet', ['Wallet 4'])).toBe('Wallet 5');
    });

    it('ignores labels whose suffix is not a plain ASCII number', () => {
        expect(
            suggestWalletName('Wallet', [
                'Wallet v4R2',
                'Wallet 2x',
                'Wallet 1.5',
                'Wallet 007',
                'Wallet ٢'
            ])
        ).toBe('Wallet');
    });

    it('ignores unrelated labels', () => {
        expect(suggestWalletName('Wallet', ["Mum's wallet", 'Savings'])).toBe('Wallet');
    });

    it('trims the base and labels before matching', () => {
        expect(suggestWalletName(' Wallet ', ['Wallet 2 '])).toBe('Wallet 3');
    });

    it('returns a blank base unchanged', () => {
        expect(suggestWalletName('', ['Wallet'])).toBe('');
        expect(suggestWalletName('   ', ['Wallet'])).toBe('   ');
    });
});
