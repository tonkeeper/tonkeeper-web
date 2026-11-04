/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { mnemonicToKeypair } from '../../service/mnemonicService';
import { CHAIN_IDS, ChainId } from '../types';
import { DEFAULT_BIP44_PATH, pathFor } from '../derivation';

/**
 * Canonical BIP-39 test vector (abandon × 11 + about). The expected public
 * key hex below mirrors the snapshot harness fixtures
 * (`__tests__/snapshots/sign/mnemonic-bip39__*__MAINNET.json`); keeping it
 * in lock-step means a regression in the TON derivation path (e.g.
 * accidentally dropping the `'/0'` suffix or routing through the wrong
 * curve) breaks this fast unit test before the slower snapshot suite
 * notices.
 */
const ABANDON_BIP39_FIXTURE = [
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'abandon',
    'about'
];

const EXPECTED_TON_PUBLIC_KEY_HEX =
    '7952e94118f34607c75e23258dd9220d66ccac5a3ee074125c25068e8107bfbf';

describe('chains/derivation', () => {
    it('pins the TON default path to SLIP-0044 coin type 607', () => {
        expect(DEFAULT_BIP44_PATH.ton).toBe("m/44'/607'/0'");
    });

    it('exposes a path entry for every ChainId', () => {
        for (const chain of CHAIN_IDS) {
            expect(DEFAULT_BIP44_PATH[chain]).toMatch(/^m\//);
        }
    });

    it.each(CHAIN_IDS)('pathFor(%s) returns the table default for index 0', chain => {
        expect(pathFor(chain)).toBe(DEFAULT_BIP44_PATH[chain]);
        expect(pathFor(chain, 0)).toBe(DEFAULT_BIP44_PATH[chain]);
    });

    it('throws for non-zero account indices', () => {
        const chain: ChainId = 'ton';
        expect(() => pathFor(chain, 1)).toThrow(/non-zero account indices/);
    });

    it('TON BIP39 derivation produces the snapshot-pinned public key', async () => {
        const keyPair = await mnemonicToKeypair(ABANDON_BIP39_FIXTURE, 'bip39');
        expect(Buffer.from(keyPair.publicKey).toString('hex')).toBe(EXPECTED_TON_PUBLIC_KEY_HEX);
    });
});
