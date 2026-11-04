/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import {
    hasRecoverableSecret,
    readHandoffAccounts,
    readRecoverableAccounts,
    removeAccountWrites
} from './accounts';
import { StorageSnapshot } from './storage';

const PUBLIC_KEY = 'a'.repeat(64);
const OTHER_PUBLIC_KEY = 'b'.repeat(64);

const RAW_ADDRESS = '0:83dfd552e63729b472fcbcc8c45ebcc6691702558b68ec7527e1ba403a0f31a8';
const SHORT_ADDRESS = 'UQCD…qEBI';

const envelope = (payload: unknown): string => JSON.stringify({ payload });

const snapshot = (entries: Record<string, unknown>): StorageSnapshot =>
    Object.fromEntries(
        Object.entries(entries).map(([key, payload]) => [`tonkeeper_${key}`, envelope(payload)])
    );

const vault = (id = PUBLIC_KEY) => ({ kind: 'password', encryptedSecret: `vault-${id}` });

const tonWallet = (rawAddress = RAW_ADDRESS) => ({
    id: rawAddress,
    rawAddress,
    publicKey: PUBLIC_KEY,
    version: 3
});

const mnemonicAccount = (overrides: Record<string, unknown> = {}) => ({
    type: 'mnemonic',
    id: PUBLIC_KEY,
    name: 'Old Wallet',
    emoji: '🐰',
    auth: vault(),
    activeTonWalletId: RAW_ADDRESS,
    tonWallets: [tonWallet()],
    ...overrides
});

describe('readRecoverableAccounts', () => {
    it('finds nothing in a profile that has never been used', () => {
        expect(readRecoverableAccounts({})).toEqual([]);
    });

    it('lists an account with the vault this origin can open', () => {
        expect(readRecoverableAccounts(snapshot({ accounts: [mnemonicAccount()] }))).toEqual([
            {
                id: PUBLIC_KEY,
                name: { custom: 'Old Wallet' },
                emoji: '🐰',
                label: { address: SHORT_ADDRESS },
                encryptedSecret: `vault-${PUBLIC_KEY}`,
                layout: 'accounts'
            }
        ]);
    });

    it('leaves out the accounts that never held a secret here', () => {
        const mixed = snapshot({
            accounts: [
                { type: 'watch-only', id: '1', name: 'Watching' },
                { type: 'ledger', id: '2', name: 'Ledger' },
                { type: 'ton-only', id: '3', name: 'Signer', auth: { kind: 'signer' } },
                mnemonicAccount()
            ]
        });

        expect(readRecoverableAccounts(mixed).map(account => account.name)).toEqual([
            { custom: 'Old Wallet' }
        ]);
    });

    it('leaves out an account whose secret is kept outside this browser', () => {
        const keychain = mnemonicAccount({
            auth: { kind: 'keychain', keychainStoreKey: PUBLIC_KEY }
        });

        expect(readRecoverableAccounts(snapshot({ accounts: [keychain] }))).toEqual([]);
    });

    it('counts the wallets when an account has more than one', () => {
        const twoVersions = mnemonicAccount({
            tonWallets: [tonWallet(), tonWallet(`0:${'cd'.repeat(32)}`)]
        });

        expect(readRecoverableAccounts(snapshot({ accounts: [twoVersions] }))[0].label).toEqual({
            walletCount: 2
        });
    });

    it('marks a testnet address as test-only', () => {
        const testnet = mnemonicAccount({ type: 'testnet' });

        expect(readRecoverableAccounts(snapshot({ accounts: [testnet] }))[0].label).toEqual({
            address: '0QCD…qPvC'
        });
    });

    it('reads a MAM account through the derivations that were added', () => {
        const mam = {
            type: 'mam',
            id: PUBLIC_KEY,
            name: 'MAM',
            emoji: 'custom:wallet',
            auth: vault(),
            activeDerivationIndex: 0,
            addedDerivationsIndexes: [0],
            allAvailableDerivations: [
                { index: 0, tonWallets: [tonWallet()] },
                { index: 1, tonWallets: [tonWallet(`0:${'cd'.repeat(32)}`)] }
            ]
        };

        expect(readRecoverableAccounts(snapshot({ accounts: [mam] }))[0].label).toEqual({
            address: SHORT_ADDRESS
        });
    });

    it('reads a multichain account through its TON wallet alone', () => {
        const multichain = {
            type: 'multichain',
            id: PUBLIC_KEY,
            name: 'Multichain',
            emoji: 'custom:wallet',
            auth: vault(),
            enabledChains: ['ton', 'evm'],
            wallets: [tonWallet(), { chain: 'evm', id: '0xabc', address: '0xabc' }]
        };

        expect(readRecoverableAccounts(snapshot({ accounts: [multichain] }))[0].label).toEqual({
            address: SHORT_ADDRESS
        });
    });

    it('falls back to a name and no address when neither is stored', () => {
        const bare = { type: 'mnemonic', id: PUBLIC_KEY, auth: vault() };

        expect(readRecoverableAccounts(snapshot({ accounts: [bare] }))[0]).toMatchObject({
            name: { default: true },
            emoji: 'custom:wallet',
            label: undefined
        });
    });

    it('reads the layout that predates the accounts key', () => {
        const deprecated = snapshot({
            account: { publicKeys: [PUBLIC_KEY], activePublicKey: PUBLIC_KEY },
            [`wallet_${PUBLIC_KEY}`]: {
                publicKey: PUBLIC_KEY,
                name: 'Ancient',
                emoji: '🦕',
                active: { rawAddress: RAW_ADDRESS, friendlyAddress: 'UQCD39VS5jcptHL8vMjEXrz' }
            },
            [`mnemonic_${PUBLIC_KEY}`]: 'legacy-vault'
        });

        expect(readRecoverableAccounts(deprecated)).toEqual([
            {
                id: PUBLIC_KEY,
                name: { custom: 'Ancient' },
                emoji: '🦕',
                label: { address: 'UQCD…EXrz' },
                encryptedSecret: 'legacy-vault',
                layout: 'deprecated'
            }
        ]);
    });

    it('still offers a stray phrase whose wallet record is gone', () => {
        const stray = snapshot({ [`mnemonic_${PUBLIC_KEY}`]: 'legacy-vault' });

        expect(readRecoverableAccounts(stray)).toMatchObject([
            { id: PUBLIC_KEY, name: { ordinal: 1 }, label: undefined, layout: 'deprecated' }
        ]);
    });

    it('ignores the deprecated layout once accounts have been migrated', () => {
        const both = snapshot({
            accounts: [mnemonicAccount()],
            [`mnemonic_${OTHER_PUBLIC_KEY}`]: 'legacy-vault'
        });

        expect(readRecoverableAccounts(both).map(account => account.id)).toEqual([PUBLIC_KEY]);
    });
});

describe('hasRecoverableSecret', () => {
    it('is false for a profile that has never been used', () => {
        expect(hasRecoverableSecret({})).toBe(false);
    });

    it('is true when one account among several has a secret here', () => {
        const mixed = snapshot({
            accounts: [{ type: 'watch-only', id: '1' }, mnemonicAccount()]
        });

        expect(hasRecoverableSecret(mixed)).toBe(true);
    });

    it('is false for a profile of watch-only and hardware accounts', () => {
        const noSecrets = snapshot({
            accounts: [
                { type: 'watch-only', id: '1' },
                { type: 'ledger', id: '2' }
            ]
        });

        expect(hasRecoverableSecret(noSecrets)).toBe(false);
    });
});

describe('removeAccountWrites', () => {
    const [account] = readRecoverableAccounts(snapshot({ accounts: [mnemonicAccount()] }));

    it('takes the account, and only it, out of the accounts array', () => {
        const other = mnemonicAccount({ id: OTHER_PUBLIC_KEY, auth: vault(OTHER_PUBLIC_KEY) });
        const state = snapshot({
            accounts: [mnemonicAccount(), other],
            active_account_id: OTHER_PUBLIC_KEY
        });

        expect(removeAccountWrites(state, account)).toEqual([
            { key: 'accounts', payload: [other] }
        ]);
    });

    it('hands the active account on to whatever is left', () => {
        const other = mnemonicAccount({ id: OTHER_PUBLIC_KEY, auth: vault(OTHER_PUBLIC_KEY) });
        const state = snapshot({
            accounts: [mnemonicAccount(), other],
            active_account_id: PUBLIC_KEY
        });

        expect(removeAccountWrites(state, account)).toContainEqual({
            key: 'active_account_id',
            payload: OTHER_PUBLIC_KEY
        });
    });

    it('leaves no active account behind when the last one goes', () => {
        const state = snapshot({
            accounts: [mnemonicAccount()],
            active_account_id: PUBLIC_KEY
        });

        expect(removeAccountWrites(state, account)).toEqual([
            { key: 'accounts', payload: [] },
            { key: 'active_account_id', payload: null }
        ]);
    });

    it("takes the wallet's sessions and Battery token with it, unless another account shares them", () => {
        const sibling = mnemonicAccount({
            id: OTHER_PUBLIC_KEY,
            auth: vault(OTHER_PUBLIC_KEY),
            tonWallets: [tonWallet(`0:${'cd'.repeat(32)}`)]
        });
        const state = snapshot({
            accounts: [mnemonicAccount(), sibling],
            [`connections_${RAW_ADDRESS}_-239`]: [{ clientSessionId: 'x' }],
            [`connections_${RAW_ADDRESS}_-3`]: [{ clientSessionId: 'y' }],
            [`battery_auth_token_${PUBLIC_KEY}`]: { token: 'shared' },
            [`connections_0:${'cd'.repeat(32)}_-239`]: [{ clientSessionId: 'z' }]
        });

        expect(removeAccountWrites(state, account)).toEqual([
            { key: 'accounts', payload: [sibling] },
            { key: `connections_${RAW_ADDRESS}_-239`, remove: true },
            { key: `connections_${RAW_ADDRESS}_-3`, remove: true }
        ]);
    });

    it('removes both records of a deprecated account, and its public key', () => {
        const state = snapshot({
            account: { publicKeys: [PUBLIC_KEY, OTHER_PUBLIC_KEY], activePublicKey: PUBLIC_KEY },
            [`wallet_${PUBLIC_KEY}`]: { publicKey: PUBLIC_KEY },
            [`mnemonic_${PUBLIC_KEY}`]: 'legacy-vault'
        });
        const [deprecated] = readRecoverableAccounts(state);

        expect(removeAccountWrites(state, deprecated)).toEqual([
            { key: `mnemonic_${PUBLIC_KEY}`, remove: true },
            { key: `wallet_${PUBLIC_KEY}`, remove: true },
            {
                key: 'account',
                payload: { publicKeys: [OTHER_PUBLIC_KEY], activePublicKey: OTHER_PUBLIC_KEY }
            }
        ]);
    });
});

describe('readHandoffAccounts', () => {
    it('lists every account that travels, secret or not', () => {
        const accounts = readHandoffAccounts(
            snapshot({
                accounts: [
                    mnemonicAccount(),
                    {
                        type: 'watch-only',
                        id: 'watch',
                        name: 'Watched',
                        emoji: '👀',
                        tonWallet: tonWallet()
                    },
                    { type: 'ledger', id: 'ledger', name: 'Ledger', emoji: '🔐' }
                ]
            })
        );

        expect(accounts).toEqual([
            {
                id: PUBLIC_KEY,
                name: { custom: 'Old Wallet' },
                emoji: '🐰',
                label: { address: SHORT_ADDRESS },
                kind: undefined
            },
            {
                id: 'watch',
                name: { custom: 'Watched' },
                emoji: '👀',
                label: { address: SHORT_ADDRESS },
                kind: 'Watch Only'
            },
            {
                id: 'ledger',
                name: { custom: 'Ledger' },
                emoji: '🔐',
                label: undefined,
                kind: 'Ledger'
            }
        ]);
    });

    it('tags a multichain account', () => {
        const [account] = readHandoffAccounts(
            snapshot({ accounts: [{ type: 'multichain', id: 'm', name: 'Everyday', wallets: [] }] })
        );

        expect(account.kind).toBe('Multichain');
    });

    it('reads the layout that predates the accounts key', () => {
        const accounts = readHandoffAccounts(
            snapshot({
                account: { publicKeys: [PUBLIC_KEY] },
                [`wallet_${PUBLIC_KEY}`]: {
                    name: 'Old',
                    emoji: '🐰',
                    active: { rawAddress: RAW_ADDRESS }
                },
                [`mnemonic_${OTHER_PUBLIC_KEY}`]: 'vault'
            })
        );

        expect(accounts.map(account => account.id)).toEqual([PUBLIC_KEY, OTHER_PUBLIC_KEY]);
        expect(accounts[0]).toMatchObject({
            name: { custom: 'Old' },
            label: { address: SHORT_ADDRESS }
        });
    });
});
