/* eslint-disable import/no-extraneous-dependencies */
import { Address } from '@ton/core';
import { describe, expect, it } from 'vitest';
import { Network } from '../../entries/network';
import { eqAddresses, formatAddress, isTonAddress, isTonCoinAddress } from '../address';

const RAW = '0:83dfd552e63729b472fcbcc8c45ebcc6691702558b68ec7527e1ba403a0f31a8';
const FRIENDLY = 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N';
const FRIENDLY_NON_BOUNCEABLE = 'UQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqEBI';
const FRIENDLY_TESTNET = 'kQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqKYH';
const OTHER = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIny';
const JETTON = 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs';

describe('eqAddresses', () => {
    it('returns true for identical string references (fast path)', () => {
        expect(eqAddresses(FRIENDLY, FRIENDLY)).toBe(true);
    });

    it('matches different encodings of the same address', () => {
        expect(eqAddresses(RAW, FRIENDLY)).toBe(true);
        expect(eqAddresses(FRIENDLY, FRIENDLY_NON_BOUNCEABLE)).toBe(true);
        expect(eqAddresses(Address.parse(RAW), FRIENDLY_NON_BOUNCEABLE)).toBe(true);
    });

    it('accepts Address instances on either side', () => {
        const parsed = Address.parse(FRIENDLY);
        expect(eqAddresses(parsed, parsed)).toBe(true);
        expect(eqAddresses(parsed, RAW)).toBe(true);
        expect(eqAddresses(RAW, parsed)).toBe(true);
    });

    it('returns false for distinct addresses', () => {
        expect(eqAddresses(FRIENDLY, OTHER)).toBe(false);
    });

    it('returns false when the second argument is missing', () => {
        expect(eqAddresses(FRIENDLY)).toBe(false);
        expect(eqAddresses(FRIENDLY, undefined)).toBe(false);
    });

    it('returns false on parse failure instead of throwing', () => {
        expect(eqAddresses('not-an-address', FRIENDLY)).toBe(false);
        expect(eqAddresses(FRIENDLY, 'not-an-address')).toBe(false);
    });
});

describe('isTonCoinAddress', () => {
    it('matches the TON crypto currency tag case-insensitively', () => {
        expect(isTonCoinAddress('TON')).toBe(true);
        expect(isTonCoinAddress('ton')).toBe(true);
        expect(isTonCoinAddress('Ton')).toBe(true);
    });

    it('returns false for jetton or wallet addresses', () => {
        expect(isTonCoinAddress(JETTON)).toBe(false);
        expect(isTonCoinAddress(FRIENDLY)).toBe(false);
        expect(isTonCoinAddress('')).toBe(false);
    });
});

describe('formatAddress', () => {
    const FRIENDLY_TESTNET_NON_BOUNCEABLE = '0QCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqPvC';

    it('defaults to the mainnet non-bounceable form', () => {
        // bounceable defaults to false, so EQ becomes UQ.
        expect(formatAddress(RAW)).toBe(FRIENDLY_NON_BOUNCEABLE);
    });

    it('returns the bounceable form when bounceable=true', () => {
        expect(formatAddress(RAW, Network.MAINNET, true)).toBe(FRIENDLY);
    });

    it('switches the prefix to testnet (kQ/0Q) when network is TESTNET', () => {
        expect(formatAddress(RAW, Network.TESTNET, true)).toBe(FRIENDLY_TESTNET);
        expect(formatAddress(RAW, Network.TESTNET, false)).toBe(FRIENDLY_TESTNET_NON_BOUNCEABLE);
    });

    it('accepts an Address instance', () => {
        expect(formatAddress(Address.parse(RAW), Network.MAINNET, true)).toBe(FRIENDLY);
    });
});

describe('isTonAddress', () => {
    it('accepts both raw and friendly forms', () => {
        expect(isTonAddress(RAW)).toBe(true);
        expect(isTonAddress(FRIENDLY)).toBe(true);
        expect(isTonAddress(FRIENDLY_NON_BOUNCEABLE)).toBe(true);
    });

    it('rejects garbage strings', () => {
        expect(isTonAddress('')).toBe(false);
        expect(isTonAddress('not-an-address')).toBe(false);
        expect(isTonAddress('0:nothex')).toBe(false);
    });

    it('rejects URL-shaped strings (e.g. ton:// links)', () => {
        expect(isTonAddress(`ton://transfer/${FRIENDLY}`)).toBe(false);
        expect(isTonAddress(`https://tonkeeper.com/${FRIENDLY}`)).toBe(false);
    });
});
