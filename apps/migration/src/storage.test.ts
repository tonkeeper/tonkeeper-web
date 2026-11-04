/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { dropMetaEncryptionMap, hasMigrated, hasWalletData, StorageSnapshot } from './storage';

const PUBLIC_KEY = 'a'.repeat(64);

const envelope = (payload: unknown): string => JSON.stringify({ payload });

const snapshot = (entries: Record<string, unknown>): StorageSnapshot =>
    Object.fromEntries(
        Object.entries(entries).map(([key, payload]) => [`tonkeeper_${key}`, envelope(payload)])
    );

/** Only the fields the probe looks at — it never inspects an account further. */
const account = (type: string) => ({ type, id: PUBLIC_KEY, name: 'Wallet' });

describe('hasWalletData', () => {
    it('is false for a profile that has never been used', () => {
        expect(hasWalletData({})).toBe(false);
    });

    it.each(['mnemonic', 'testnet', 'watch-only', 'ledger', 'keystone', 'ton-multisig'])(
        'is true for a %s account',
        type => {
            expect(hasWalletData(snapshot({ accounts: [account(type)] }))).toBe(true);
        }
    );

    it('is false once every account has been removed', () => {
        expect(hasWalletData(snapshot({ accounts: [], active_account_id: null }))).toBe(false);
    });

    it('is false for preferences alone, which a visit writes on its own', () => {
        const preferences = snapshot({
            theme: 'dark',
            language: 'en',
            fiat: 'USD',
            country: 'DE',
            ui_preferences: { asideWidth: 250 }
        });

        expect(hasWalletData(preferences)).toBe(false);
    });

    it('is false for the wallet-prefixed keys that hold no wallet', () => {
        const config = snapshot({
            wallet_config: { pinnedTokens: [] },
            wallet_connect: {},
            wallet_connect_meta: {}
        });

        expect(hasWalletData(config)).toBe(false);
    });

    it('is true for the account state that predates the accounts key', () => {
        const deprecated = snapshot({
            account: { publicKeys: [PUBLIC_KEY], activePublicKey: PUBLIC_KEY }
        });

        expect(hasWalletData(deprecated)).toBe(true);
    });

    it.each(['wallet', 'mnemonic'])(
        'is true for a stray deprecated %s record, keyed by public key',
        key => {
            expect(hasWalletData(snapshot({ [`${key}_${PUBLIC_KEY}`]: 'anything' }))).toBe(true);
        }
    );

    it('ignores keys belonging to anything else on the origin', () => {
        expect(hasWalletData({ accounts: envelope([account('mnemonic')]) })).toBe(false);
    });

    it('is false rather than throwing when a value is unreadable', () => {
        expect(hasWalletData({ tonkeeper_accounts: '{"payload":[' })).toBe(false);
        expect(hasWalletData({ tonkeeper_accounts: 'null' })).toBe(false);
        expect(hasWalletData({ tonkeeper_accounts: '' })).toBe(false);
    });
});

describe('hasMigrated', () => {
    it('is false until a handoff completes', () => {
        expect(hasMigrated(snapshot({ accounts: [account('mnemonic')] }))).toBe(false);
    });

    it('is true once the flag is written', () => {
        expect(hasMigrated(snapshot({ migrated_at: '2026-09-22T10:00:00.000Z' }))).toBe(true);
    });

    it('is false rather than throwing when the flag is unreadable', () => {
        expect(hasMigrated({ tonkeeper_migrated_at: 'not json' })).toBe(false);
    });
});

describe('dropMetaEncryptionMap', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('removes the map and leaves the rest of the wallet in place', () => {
        const store = new Map([
            ['tonkeeper_meta_encryption_map', envelope({ a: {} })],
            ['tonkeeper_accounts', envelope([account('mnemonic')])]
        ]);
        vi.stubGlobal('localStorage', {
            removeItem: (key: string) => store.delete(key),
            setItem: (key: string, value: string) => store.set(key, value)
        });

        dropMetaEncryptionMap();

        expect([...store.keys()]).toEqual(['tonkeeper_accounts']);
    });

    it('does not throw when site data is blocked', () => {
        vi.stubGlobal('localStorage', {
            removeItem: () => {
                throw new Error('SecurityError');
            }
        });

        expect(() => dropMetaEncryptionMap()).not.toThrow();
    });
});
