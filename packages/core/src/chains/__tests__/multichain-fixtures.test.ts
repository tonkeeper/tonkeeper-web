/* eslint-disable import/no-extraneous-dependencies */
import { beforeAll, describe, expect, it } from 'vitest';

import { ChainId, ensureReady, getAdapter } from '..';

beforeAll(() => ensureReady());

/**
 * Pinned regression canary against chain-kit derivation drift.
 *
 * The mnemonic is the universally-recognized BIP39 reference vector
 * (`abandon` ×11 + `about` — the first valid checksum in the BIP39
 * wordlist). Any upgrade to chain-kit's wallet-core or its path
 * defaults that changes a derived address will fail this test loudly
 * instead of silently moving every multichain user's address.
 */
const CANONICAL_BIP39 =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

// Reference values: every BIP39 implementation that derives the
// canonical mnemonic at `DEFAULT_BIP44_PATH[chain]` produces these
// addresses. EVM uses m/44'/60'/0'/0/0; BTC uses BIP-84 native segwit
// m/84'/0'/0'/0/0; TRON uses canonical BIP-44 m/44'/195'/0'/0/0.
const EXPECTED: Partial<Record<ChainId, string>> = {
    evm: '0x9858EfFD232B4033E47d90003D41EC34EcaEda94',
    btc: 'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu',
    tron: 'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH'
};

describe('multichain derivation fixtures', () => {
    it.each(Object.entries(EXPECTED) as [ChainId, string][])(
        '%s — canonical BIP39 derives to the pinned address',
        async (chain, expected) => {
            const { address } = await getAdapter(chain).deriveKeys({ mnemonic: CANONICAL_BIP39 });
            expect(address).toBe(expected);
        }
    );
});
