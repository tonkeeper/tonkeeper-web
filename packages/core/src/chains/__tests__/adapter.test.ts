/* eslint-disable import/no-extraneous-dependencies */
import { beforeAll, describe, expect, it } from 'vitest';

import { CHAIN_IDS, NotImplementedError, ensureReady, getAdapter } from '..';

// Chain-kit must be initialised before the synchronous `validateAddress`
// calls — it's a one-shot lifecycle, then every adapter method works
// without awaiting.
beforeAll(() => ensureReady());

const KNOWN_VALID: Record<string, string> = {
    ton: 'EQBpx5YKLspJ8tiBnrLAkIH2u5R1IdDtoCXhvDqbanjIpvuQ',
    evm: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    btc: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    tron: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
};

describe('chain-kit-backed ChainAdapter', () => {
    describe('validateAddress', () => {
        for (const [chain, addr] of Object.entries(KNOWN_VALID)) {
            it(`accepts a known-good ${chain} address`, () => {
                expect(getAdapter(chain as never).validateAddress(addr)).toBe(true);
            });

            it(`rejects garbage on ${chain}`, () => {
                const adapter = getAdapter(chain as never);
                expect(adapter.validateAddress('')).toBe(false);
                expect(adapter.validateAddress('not-an-address')).toBe(false);
            });

            it(`${chain} adapter rejects addresses from a different chain`, () => {
                const adapter = getAdapter(chain as never);
                const fromOther = Object.entries(KNOWN_VALID).find(([c]) => c !== chain)![1];
                expect(adapter.validateAddress(fromOther)).toBe(false);
            });
        }

        it('sol validateAddress returns false (chain-kit lacks the module)', () => {
            expect(getAdapter('sol').validateAddress('anything')).toBe(false);
        });
    });

    describe('amount helpers', () => {
        it('uses chain-specific default decimals', () => {
            expect(getAdapter('ton').formatAmount(1_000_000_000n)).toBe('1');
            expect(getAdapter('evm').formatAmount(10n ** 18n)).toBe('1');
            expect(getAdapter('btc').formatAmount(100_000_000n)).toBe('1');
            expect(getAdapter('tron').formatAmount(1_000_000n)).toBe('1');
        });

        it('parseAmount roundtrips with formatAmount on every chain', () => {
            for (const chain of CHAIN_IDS) {
                const adapter = getAdapter(chain);
                for (const human of ['0', '1', '0.5', '1234567.89']) {
                    expect(adapter.formatAmount(adapter.parseAmount(human))).toBe(human);
                }
            }
        });

        it('respects override decimals (jettons / ERC-20)', () => {
            expect(getAdapter('ton').formatAmount(1_500_000n, { decimals: 6 })).toBe('1.5');
            expect(getAdapter('evm').parseAmount('1.5', { decimals: 6 })).toBe(1_500_000n);
        });

        it('rejects malformed numeric strings', () => {
            const ton = getAdapter('ton');
            expect(() => ton.parseAmount('abc', { decimals: 6 })).toThrow(/invalid/i);
            expect(() => ton.parseAmount('1.1234567', { decimals: 6 })).toThrow(/decimals/);
        });
    });

    describe('deriveKeys', () => {
        const CANONICAL_BIP39 =
            'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

        it.each(['evm', 'btc', 'tron'] as const)(
            '%s returns a canonical address and a hex public key from one derivation',
            async chain => {
                const { address, publicKey } = await getAdapter(chain).deriveKeys({
                    mnemonic: CANONICAL_BIP39
                });
                expect(address.length).toBeGreaterThan(0);
                expect(getAdapter(chain).validateAddress(address)).toBe(true);
                expect(publicKey).toMatch(/^[0-9a-fA-F]+$/);
            }
        );

        it('btc returns a compressed secp256k1 key (33 bytes / 66 hex chars)', async () => {
            const { publicKey } = await getAdapter('btc').deriveKeys({ mnemonic: CANONICAL_BIP39 });
            expect(publicKey).toHaveLength(66);
            expect(publicKey.slice(0, 2)).toMatch(/^0[23]$/);
        });

        it('ton throws — TON addresses are wallet-version-aware', async () => {
            await expect(
                getAdapter('ton').deriveKeys({ mnemonic: CANONICAL_BIP39 })
            ).rejects.toBeInstanceOf(NotImplementedError);
        });

        it('sol throws — chain-kit has no Solana module', async () => {
            await expect(
                getAdapter('sol').deriveKeys({ mnemonic: CANONICAL_BIP39 })
            ).rejects.toBeInstanceOf(NotImplementedError);
        });
    });

    describe('unwired write-side methods', () => {
        it('throw NotImplementedError on every chain', async () => {
            for (const chain of CHAIN_IDS) {
                const adapter = getAdapter(chain);
                await expect(
                    adapter.estimateFee({ from: '', to: '', amount: 0n })
                ).rejects.toBeInstanceOf(NotImplementedError);
                await expect(
                    adapter.buildTransaction({ from: '', to: '', amount: 0n })
                ).rejects.toBeInstanceOf(NotImplementedError);
                await expect(
                    adapter.signTransaction({ message: {}, signer: {} as never })
                ).rejects.toBeInstanceOf(NotImplementedError);
                await expect(adapter.broadcast({ signed: undefined })).rejects.toBeInstanceOf(
                    NotImplementedError
                );
            }
        });
    });

    describe('registry', () => {
        it('returns one adapter per chain id and memoises it', () => {
            for (const chain of CHAIN_IDS) {
                const a = getAdapter(chain);
                const b = getAdapter(chain);
                expect(a).toBe(b);
                expect(a.chain).toBe(chain);
            }
        });
    });
});
