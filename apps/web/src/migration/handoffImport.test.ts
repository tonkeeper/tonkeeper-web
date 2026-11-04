/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

// `accountsStorage` reaches `@ton-keychain/*` through `walletService`, whose ESM
// breaks under Node's loader; nothing under test calls into either.
vi.mock('@ton-keychain/core', () => ({}));
vi.mock('@ton-keychain/trx', () => ({}));

import { AppKey } from '@tonkeeper/core/dist/Keys';
import { MemoryStorage } from '@tonkeeper/core/dist/Storage';
import { decrypt, encrypt } from '@tonkeeper/core/dist/service/cryptoService';

import { adoptLegacyUserId, applyHandoffImport, planHandoffImport } from './handoffImport';

const RAW_ADDRESS = '0:' + '1'.repeat(64);
const V2_VAULT = 'v2:00:600000:00:AA==';

const mnemonicAccount = (id: string, encryptedSecret = V2_VAULT) => ({
    type: 'mnemonic',
    id,
    name: `Wallet ${id}`,
    emoji: 'custom:wallet',
    auth: { kind: 'password', encryptedSecret },
    activeTonWalletId: RAW_ADDRESS,
    tonWallets: [{ id: RAW_ADDRESS, publicKey: id, version: 5, rawAddress: RAW_ADDRESS }]
});

const watchOnly = (id: string) => ({
    type: 'watch-only',
    id,
    name: `Watch ${id}`,
    emoji: 'custom:wallet',
    tonWallet: { id: RAW_ADDRESS, rawAddress: RAW_ADDRESS }
});

const storageWith = async (values: Record<string, unknown>) => {
    const storage = new MemoryStorage();
    await storage.setBatch(JSON.parse(JSON.stringify(values)));
    return storage;
};

describe('planning an import', () => {
    it('adds every incoming account to an empty origin and makes one active', async () => {
        const plan = await planHandoffImport(
            { accounts: [mnemonicAccount('a'), mnemonicAccount('b')], active_account_id: 'b' },
            new MemoryStorage()
        );

        expect(plan.accounts.map(account => account.id)).toEqual(['a', 'b']);
        expect(plan.alreadyHere).toBe(0);
        expect(plan.activeAccountId).toBe('b');
        expect(plan.passwordCheck).toBeUndefined();
    });

    it('never replaces an account already here', async () => {
        const local = await storageWith({ [AppKey.ACCOUNTS]: [mnemonicAccount('a')] });

        const plan = await planHandoffImport(
            { accounts: [mnemonicAccount('a', 'v2:other'), watchOnly('w')] },
            local
        );

        expect(plan.accounts.map(account => account.id)).toEqual(['w']);
        expect(plan.alreadyHere).toBe(1);
    });

    it('never replaces any other key already here', async () => {
        const local = await storageWith({ [AppKey.FIAT]: 'EUR' });

        const plan = await planHandoffImport(
            { accounts: [watchOnly('w')], fiat: 'USD', language: 'de' },
            local
        );

        expect(plan.writes).toEqual({ language: 'de' });
    });

    it('keeps the active account this origin already has', async () => {
        const local = await storageWith({
            [AppKey.ACCOUNTS]: [watchOnly('here')],
            [AppKey.ACTIVE_ACCOUNT_ID]: 'here'
        });

        const plan = await planHandoffImport({ accounts: [watchOnly('w')] }, local);

        expect(plan.activeAccountId).toBeNull();
    });

    // The device certificate stays behind, so the new origin's device has to
    // register each wallet again on its own.
    it('marks every carried registration as not yet registered here', async () => {
        const plan = await planHandoffImport(
            {
                accounts: [watchOnly('w')],
                multichain_wallet_registration: { x: { accounts: [], registered: true } }
            },
            new MemoryStorage()
        );

        expect(plan.writes.multichain_wallet_registration).toEqual({
            x: { accounts: [], registered: false }
        });
    });

    it('asks for the password only when both sides hold vaults', async () => {
        const local = await storageWith({
            [AppKey.ACCOUNTS]: [mnemonicAccount('here', 'v2:local')]
        });

        const plan = await planHandoffImport({ accounts: [mnemonicAccount('a')] }, local);

        expect(plan.passwordCheck).toEqual({ local: 'v2:local', incoming: V2_VAULT });
    });

    it('converts the layout that predates `accounts` without writing it', async () => {
        const publicKey = 'a'.repeat(64);

        const plan = await planHandoffImport(
            {
                account: { publicKeys: [publicKey], activePublicKey: publicKey },
                [`wallet_${publicKey}`]: {
                    publicKey,
                    name: 'Old',
                    active: { rawAddress: RAW_ADDRESS, friendlyAddress: 'EQ', version: 3 },
                    auth: { kind: 'password' }
                },
                [`mnemonic_${publicKey}`]: V2_VAULT,
                password: { kind: 'password' }
            },
            new MemoryStorage()
        );

        expect(plan.accounts).toHaveLength(1);
        expect(plan.accounts[0]).toMatchObject({ id: publicKey, name: 'Old', type: 'mnemonic' });
        expect(plan.writes).toEqual({});
    });

    // An account is re-bound to its class by `type` on every read; one of an
    // unknown type would break the wallet on every boot once written.
    it.each([
        [[{ id: 'x', type: '__proto__' }]],
        [[{ id: 'x', type: 'constructor' }]],
        [[{ type: 'mnemonic' }]],
        [{ not: 'a list' }]
    ])('refuses accounts the wallet cannot read: %j', async accounts => {
        await expect(planHandoffImport({ accounts }, new MemoryStorage())).rejects.toThrow();
    });

    it('refuses a payload with no accounts in it', async () => {
        await expect(planHandoffImport({ fiat: 'USD' }, new MemoryStorage())).rejects.toThrow();
    });
});

describe('applying an import', () => {
    it('writes the accounts after everything else, then the active account', async () => {
        const storage = new MemoryStorage();
        const plan = await planHandoffImport(
            { accounts: [mnemonicAccount('a')], language: 'de' },
            storage
        );

        await applyHandoffImport(plan, storage);

        expect(await storage.get(AppKey.LANGUAGE)).toBe('de');
        expect((await storage.get<{ id: string }[]>(AppKey.ACCOUNTS))?.map(a => a.id)).toEqual([
            'a'
        ]);
        expect(await storage.get(AppKey.ACTIVE_ACCOUNT_ID)).toBe('a');
    });

    it('skips an account another tab added while the plan was open', async () => {
        const storage = new MemoryStorage();
        const plan = await planHandoffImport({ accounts: [mnemonicAccount('a')] }, storage);

        await storage.set(AppKey.ACCOUNTS, [mnemonicAccount('a', 'v2:added-meanwhile')]);
        await applyHandoffImport(plan, storage);

        const accounts = await storage.get<ReturnType<typeof mnemonicAccount>[]>(AppKey.ACCOUNTS);

        expect(accounts).toHaveLength(1);
        expect(accounts?.[0].auth.encryptedSecret).toBe('v2:added-meanwhile');
    });

    it('refuses to import when another tab changes the local password', async () => {
        const original = await encrypt('local secret', 'original password');
        const incoming = await encrypt('incoming secret', 'original password');
        const storage = await storageWith({
            [AppKey.ACCOUNTS]: [mnemonicAccount('local', original)]
        });
        const plan = await planHandoffImport(
            { accounts: [mnemonicAccount('incoming', incoming)] },
            storage
        );

        await storage.set(AppKey.ACCOUNTS, [
            mnemonicAccount('local', await encrypt('local secret', 'new password'))
        ]);

        await expect(applyHandoffImport(plan, storage)).rejects.toThrow(
            'Local password wallets changed'
        );
        const accounts = await storage.get<ReturnType<typeof mnemonicAccount>[]>(AppKey.ACCOUNTS);
        expect(accounts?.map(account => account.id)).toEqual(['local']);
        await expect(decrypt(accounts![0].auth.encryptedSecret, 'new password')).resolves.toBe(
            'local secret'
        );
    });

    it('refuses to import when another tab adds a password wallet', async () => {
        const storage = new MemoryStorage();
        const plan = await planHandoffImport({ accounts: [mnemonicAccount('incoming')] }, storage);

        await storage.set(AppKey.ACCOUNTS, [mnemonicAccount('new', 'v2:another-password')]);

        await expect(applyHandoffImport(plan, storage)).rejects.toThrow(
            'Local password wallets changed'
        );
    });

    // The preferences record is skipped whole when this origin has one, which
    // used to drop the colours of the accounts being added.
    it('carries the colours of added accounts into preferences already here', async () => {
        const storage = await storageWith({
            [AppKey.ACCOUNTS]: [watchOnly('here')],
            [AppKey.GLOBAL_PREFERENCES_CONFIG]: { walletColors: { here: 'red' } }
        });
        const plan = await planHandoffImport(
            {
                accounts: [watchOnly('a'), watchOnly('b'), watchOnly('here')],
                global_preferences_config: {
                    walletColors: { a: 'green', here: 'blue', gone: 'pink' },
                    folders: [{ id: 'f', accounts: ['a'] }]
                }
            },
            storage
        );

        expect(plan.walletColors).toEqual({ a: 'green' });

        await applyHandoffImport(plan, storage);

        const preferences = await storage.get<{ walletColors: unknown; folders: unknown }>(
            AppKey.GLOBAL_PREFERENCES_CONFIG
        );
        expect(preferences?.walletColors).toEqual({ here: 'red', a: 'green' });
        expect(preferences?.folders).toEqual([]);
    });

    it('keeps a lock enabled in another tab after planning', async () => {
        const storage = new MemoryStorage();
        const plan = await planHandoffImport(
            { accounts: [watchOnly('incoming')], lock: false },
            storage
        );

        await storage.set(AppKey.LOCK, true);
        await applyHandoffImport(plan, storage);

        expect(await storage.get(AppKey.LOCK)).toBe(true);
    });
});

describe('the analytics id', () => {
    const OLD_ID = '0b6f3c1e-8a4d-4c2b-9e7f-1a2b3c4d5e6f';
    const NEW_ID = 'f1e2d3c4-b5a6-4978-8a6b-5c4d3e2f1a0b';

    it('replaces the id an origin without wallets has already made', async () => {
        const local = await storageWith({ [AppKey.USER_ID]: NEW_ID });

        const plan = await planHandoffImport(
            { accounts: [watchOnly('w')], user_id: OLD_ID },
            local
        );

        expect(plan.writes).toEqual({});
        expect(plan.legacyUserId).toBe(OLD_ID);

        await applyHandoffImport(plan, local);
        expect(await local.get(AppKey.USER_ID)).toBe(NEW_ID);

        await adoptLegacyUserId(plan, local);
        expect(await local.get(AppKey.USER_ID)).toBe(OLD_ID);
    });

    it('stays with an origin that has wallets of its own, and is still reported', async () => {
        const local = await storageWith({
            [AppKey.ACCOUNTS]: [watchOnly('here')],
            [AppKey.USER_ID]: NEW_ID
        });

        const plan = await planHandoffImport(
            { accounts: [watchOnly('w')], user_id: OLD_ID },
            local
        );
        await adoptLegacyUserId(plan, local);

        expect(plan.legacyUserId).toBe(OLD_ID);
        expect(await local.get(AppKey.USER_ID)).toBe(NEW_ID);
    });

    it('is ignored when it is not an id', async () => {
        const local = await storageWith({ [AppKey.USER_ID]: NEW_ID });

        const plan = await planHandoffImport(
            { accounts: [watchOnly('w')], user_id: 'not-an-id' },
            local
        );
        await adoptLegacyUserId(plan, local);

        expect(plan.legacyUserId).toBeUndefined();
        expect(await local.get(AppKey.USER_ID)).toBe(NEW_ID);
    });
});
