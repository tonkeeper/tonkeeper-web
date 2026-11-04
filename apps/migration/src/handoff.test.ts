/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { decryptSecret } from './crypto';
import { readHandoffAccounts } from './accounts';
import {
    hasLegacyVaults,
    hasPasswordVaults,
    isHandoffKey,
    isWellFormedRequest,
    sealHandoff,
    selectHandoffEntries,
    unlockVaults
} from './handoff';

const PASSWORD = 'password123';

const PHRASE =
    'abandon ability able about above absent absorb abstract absurd abuse access accident';

/** Both hold PHRASE under PASSWORD — the same fixtures as `crypto.test.ts`. */
const V2_VAULT =
    'v2:b53e5b61449cb99813d8111811e721d7:600000:11430e5ba7a48366eeda606e:pI4oiKBoKNuI8upMBqaHDUMhBcFDi1rfGy9K8TcSE9zqXQXKo9TF01EjcwUc5/yEGLQnBu2J7zogGbRlI88D98i4qzsVHoIMrmHryUVuXNIu3q143DIjOwo8HNrf/kNqgMGFAA==';
const V1_VAULT =
    '3ecba13bf4e0ae0239952f881z7/43kUjLOqFWsd076VJ5hO8B/iGU0gQ70+4vkOiAlTF6DUN3Elk33qvVnx5fo2kDPXkgZ7Sa/BvDuW0NXHVWMV9V9J97SWz0dnmMGaWf/CQzM87UVDbwkFjjPlWUBjLKpOrA==';

const PUBLIC_KEY_HEX = 'a'.repeat(64);

const stored = (payload: unknown) => JSON.stringify({ payload });

const passwordAccount = (id: string, encryptedSecret: string) => ({
    id,
    type: 'mnemonic',
    auth: { kind: 'password', encryptedSecret }
});

describe('what travels', () => {
    it('takes the allowlisted keys and nothing else', () => {
        const entries = selectHandoffEntries({
            tonkeeper_accounts: stored([passwordAccount('a', V2_VAULT)]),
            tonkeeper_active_account_id: stored('a'),
            'tonkeeper_connections_a_-239': stored([{ clientSessionId: 'x' }]),
            tonkeeper_meta_encryption_map: stored({ a: {} }),
            tonkeeper_touch_id: stored({ credentialId: 'x' }),
            tonkeeper_pro_auth_token: stored('token'),
            tonkeeper_multichain_device_certificate: stored({ privateKey: 'x' }),
            tonkeeper_migrated_at: stored(1),
            unrelated_accounts: stored(['not the wallet’s'])
        });

        expect(Object.keys(entries).sort()).toEqual([
            'accounts',
            'active_account_id',
            'connections_a_-239'
        ]);
    });

    it('takes the layout that predates `accounts`', () => {
        const entries = selectHandoffEntries({
            tonkeeper_account: stored({ publicKeys: [PUBLIC_KEY_HEX] }),
            [`tonkeeper_wallet_${PUBLIC_KEY_HEX}`]: stored({ name: 'Old' }),
            [`tonkeeper_mnemonic_${PUBLIC_KEY_HEX}`]: stored(V1_VAULT),
            tonkeeper_password: stored({ kind: 'password' })
        });

        expect(Object.keys(entries)).toHaveLength(4);
    });

    it('leaves obsolete vaults behind when the consent lists modern accounts', () => {
        const snapshot = {
            tonkeeper_accounts: stored([passwordAccount('current', V2_VAULT)]),
            tonkeeper_account: stored({ publicKeys: [PUBLIC_KEY_HEX] }),
            [`tonkeeper_wallet_${PUBLIC_KEY_HEX}`]: stored({ name: 'Removed' }),
            [`tonkeeper_mnemonic_${PUBLIC_KEY_HEX}`]: stored(V1_VAULT),
            tonkeeper_password: stored({ kind: 'password' })
        };

        expect(readHandoffAccounts(snapshot).map(account => account.id)).toEqual(['current']);
        expect(selectHandoffEntries(snapshot)).toEqual({
            accounts: [passwordAccount('current', V2_VAULT)]
        });
    });

    it('omits an empty modern account list when using the old layout', () => {
        const entries = selectHandoffEntries({
            tonkeeper_accounts: stored([]),
            tonkeeper_account: stored({ publicKeys: [PUBLIC_KEY_HEX] }),
            [`tonkeeper_wallet_${PUBLIC_KEY_HEX}`]: stored({ name: 'Old' }),
            [`tonkeeper_mnemonic_${PUBLIC_KEY_HEX}`]: stored(V2_VAULT)
        });

        expect(entries.accounts).toBeUndefined();
        expect(entries[`mnemonic_${PUBLIC_KEY_HEX}`]).toBe(V2_VAULT);
    });

    it('skips a value the wallet itself could not read', () => {
        expect(selectHandoffEntries({ tonkeeper_accounts: 'not json' })).toEqual({});
    });

    it('leaves out every key it does not know', () => {
        expect(isHandoffKey('meta_encryption_map')).toBe(false);
        expect(isHandoffKey('wallet_connect')).toBe(true);
        expect(isHandoffKey('wallet_not-a-public-key')).toBe(false);
    });
});

describe('legacy vaults', () => {
    it('are found in every layout that can hold one', () => {
        expect(hasLegacyVaults({ accounts: [passwordAccount('a', V1_VAULT)] })).toBe(true);
        expect(
            hasLegacyVaults({
                accounts: [
                    {
                        id: 'a',
                        type: 'mnemonic',
                        auth: { kind: 'password', encryptedMnemonic: V1_VAULT }
                    }
                ]
            })
        ).toBe(true);
        expect(hasLegacyVaults({ [`mnemonic_${PUBLIC_KEY_HEX}`]: V1_VAULT })).toBe(true);
        expect(hasLegacyVaults({ accounts: [passwordAccount('a', V2_VAULT)] })).toBe(false);
    });

    it('are re-encrypted to the same secret, leaving the snapshot and v2 vaults alone', async () => {
        const entries = {
            accounts: [passwordAccount('a', V1_VAULT), passwordAccount('b', V2_VAULT)],
            [`mnemonic_${PUBLIC_KEY_HEX}`]: V1_VAULT
        };

        const upgraded = await unlockVaults(entries, PASSWORD);
        const [first, second] = upgraded.accounts as ReturnType<typeof passwordAccount>[];

        expect(hasLegacyVaults(upgraded)).toBe(false);
        expect(first.auth.encryptedSecret.startsWith('v2:')).toBe(true);
        expect(second.auth.encryptedSecret).toBe(V2_VAULT);
        await expect(decryptSecret(first.auth.encryptedSecret, PASSWORD)).resolves.toEqual({
            type: 'mnemonic',
            mnemonic: PHRASE.split(' ')
        });
        await expect(
            decryptSecret(upgraded[`mnemonic_${PUBLIC_KEY_HEX}`] as string, PASSWORD)
        ).resolves.toMatchObject({ type: 'mnemonic' });

        expect(entries.accounts[0].auth.encryptedSecret).toBe(V1_VAULT);
    }, 20_000);

    it('are not re-encrypted under a wrong password', async () => {
        await expect(
            unlockVaults({ accounts: [passwordAccount('a', V1_VAULT)] }, 'wrong password')
        ).rejects.toThrow();
    });

    it('ask for the password whenever any vault is present', () => {
        expect(hasPasswordVaults({ accounts: [passwordAccount('a', V2_VAULT)] })).toBe(true);
        expect(hasPasswordVaults({ [`mnemonic_${PUBLIC_KEY_HEX}`]: V1_VAULT })).toBe(true);
        expect(
            hasPasswordVaults({
                accounts: [
                    { id: 'w', type: 'watch-only' },
                    { id: 'k', type: 'mnemonic', auth: { kind: 'keychain' } }
                ]
            })
        ).toBe(false);
    });

    it('are not unlocked under a wrong password, v2 vaults included', async () => {
        await expect(
            unlockVaults({ accounts: [passwordAccount('a', V2_VAULT)] }, 'wrong password')
        ).rejects.toThrow();
    }, 20_000);

    it('are unlocked unchanged when there is nothing to re-encrypt', async () => {
        const entries = { accounts: [passwordAccount('a', V2_VAULT)] };

        await expect(unlockVaults(entries, PASSWORD)).resolves.toEqual(entries);
    }, 20_000);

    it('are never sealed as they are', async () => {
        await expect(
            sealHandoff({
                request: { nonce: 'AAECAwQFBgcICQoLDA0ODw', publicKey: 'x' },
                entries: { accounts: [passwordAccount('a', V1_VAULT)] },
                from: 'https://old-origin.test',
                to: 'https://new-origin.test'
            })
        ).rejects.toThrow();
    });
});

describe('the request it answers', () => {
    const nonce = 'AAECAwQFBgcICQoLDA0ODw';
    const publicKey = `BA${'a'.repeat(85)}`;

    it('is a 16-byte nonce and an uncompressed P-256 point', () => {
        expect(isWellFormedRequest({ nonce, publicKey })).toBe(true);
        expect(isWellFormedRequest({ nonce: 'short', publicKey })).toBe(false);
        expect(isWellFormedRequest({ nonce, publicKey: publicKey.slice(1) })).toBe(false);
        expect(isWellFormedRequest({ nonce: `${nonce.slice(1)}+`, publicKey })).toBe(false);
    });

    it('is refused when its key is not a point on the curve', async () => {
        await expect(
            sealHandoff({
                request: { nonce, publicKey },
                entries: {},
                from: 'https://old-origin.test',
                to: 'https://new-origin.test'
            })
        ).rejects.toThrow();
    });
});
