/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { WALLET_COLORS, defaultWalletColor, walletColorById } from '../walletColor';

describe('WALLET_COLORS', () => {
    it('has unique ids and 6-digit hex values', () => {
        const ids = WALLET_COLORS.map(c => c.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const color of WALLET_COLORS) {
            expect(color.hex).toMatch(/^#[0-9A-F]{6}$/);
        }
    });
});

describe('walletColorById', () => {
    it('resolves a known id and rejects anything else', () => {
        expect(walletColorById('lightPurple')?.hex).toBe('#AD89F5');
        expect(walletColorById('nonexistent')).toBeUndefined();
        expect(walletColorById(undefined)).toBeUndefined();
    });
});

describe('defaultWalletColor', () => {
    it('is stable for the same account id', () => {
        expect(defaultWalletColor('account-1')).toBe(defaultWalletColor('account-1'));
    });

    it('always returns a palette entry, including for an empty id', () => {
        for (const id of ['', 'a', 'account-1', '0:abcdef', '🙃']) {
            expect(WALLET_COLORS).toContain(defaultWalletColor(id));
        }
    });

    it('spreads different account ids across more than one colour', () => {
        const picked = new Set(
            Array.from({ length: 50 }, (_, i) => defaultWalletColor(`account-${i}`).id)
        );
        expect(picked.size).toBeGreaterThan(1);
    });
});
