/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { toFriendlyAddress, toShortAddress } from './address';

// Expected values come from `@ton/core`'s own `Address.toString`, which is what
// the wallet formats with — this app cannot import it, so they are pinned here.
describe('toFriendlyAddress', () => {
    it('formats a raw address the way the wallet showed it', () => {
        expect(toFriendlyAddress(`0:${'ab'.repeat(32)}`)).toBe(
            'UQCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq5jh'
        );
        expect(
            toFriendlyAddress('0:83dfd552e63729b472fcbcc8c45ebcc6691702558b68ec7527e1ba403a0f31a8')
        ).toBe('UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqEBI');
    });

    it('marks a testnet address as test-only', () => {
        expect(toFriendlyAddress(`0:${'ab'.repeat(32)}`, true)).toBe(
            '0QCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urqyNr'
        );
    });

    it('carries the workchain, including the masterchain', () => {
        expect(toFriendlyAddress(`-1:${'00'.repeat(31)}11`)).toBe(
            'Uf8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEW_B'
        );
    });

    it('has nothing to show for anything that is not a raw address', () => {
        expect(toFriendlyAddress('0:nothex')).toBeUndefined();
        expect(toFriendlyAddress('UQCrq6urq6urq6')).toBeUndefined();
        expect(toFriendlyAddress('')).toBeUndefined();
    });
});

describe('toShortAddress', () => {
    it('keeps both ends of an address', () => {
        expect(toShortAddress('UQCrq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq5jh')).toBe(
            'UQCr…q5jh'
        );
    });

    it('leaves a value short enough to read alone', () => {
        expect(toShortAddress('UQCrq6ur')).toBe('UQCrq6ur');
    });
});
