/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, beforeEach, vi } from 'vitest';

// `accountsStorage.ts` transitively imports `walletService.ts`, which loads
// `@ton-keychain/{core,trx}`. Those packages ship ESM with a malformed
// internal import path that breaks under vitest's Node loader. The round-trip
// code paths under test never reach those modules, so stub them out.
vi.mock('@ton-keychain/core', () => ({}));
vi.mock('@ton-keychain/trx', () => ({}));

import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import {
    Account,
    AccountKeystone,
    AccountLedger,
    AccountMAM,
    AccountMultichain,
    AccountTonMnemonic,
    AccountTonMultisig,
    AccountTonOnly,
    AccountTonSK,
    AccountTonTestnet,
    AccountTonWatchOnly
} from '../../entries/account';
import { BtcWallet } from '../../entries/btc/btc-wallet';
import { EvmWallet } from '../../entries/evm/evm-wallet';
import { SolWallet } from '../../entries/sol/sol-wallet';
import { MultichainTronWallet } from '../../entries/tron/multichain-tron-wallet';
import { TonWalletStandard, WalletVersion } from '../../entries/wallet';
import { AccountsStorage } from '../accountsStorage';

/**
 * Storage shim that round-trips values through JSON. Mirrors how every
 * real platform (electron-store, browser localStorage, mobile secure
 * storage) persists the accounts list — a class instance written via
 * `setAccounts` survives the trip only because `bindAccountToClass`
 * re-attaches the prototype after read.
 */
class JsonStorage implements IStorage {
    private store = new Map<string, string>();

    get = async <R>(key: string): Promise<R | null> => {
        const raw = this.store.get(key);
        return raw === undefined ? null : (JSON.parse(raw) as R);
    };

    set = async <R>(key: string, value: R): Promise<R | null> => {
        this.store.set(key, JSON.stringify(value));
        return value;
    };

    setBatch = async <V extends Record<string, unknown>>(values: V): Promise<V> => {
        for (const [k, v] of Object.entries(values)) {
            this.store.set(k, JSON.stringify(v));
        }
        return values;
    };

    delete = async <R>(key: string): Promise<R | null> => {
        const current = await this.get<R>(key);
        this.store.delete(key);
        return current;
    };

    clear = async (): Promise<void> => {
        this.store.clear();
    };
}

const tonStandardWallet: TonWalletStandard = {
    id: 'ton:standard',
    rawAddress: '0:standard',
    publicKey: 'standard-pubkey',
    version: WalletVersion.V5R1
};

const tonMultichainWallet: TonWalletStandard = {
    id: 'mc:ton',
    rawAddress: '0:mc',
    publicKey: 'mc-pubkey',
    version: WalletVersion.V5R1,
    derivationPath: "m/44'/607'/0'"
};

const evmWallet: EvmWallet = {
    id: 'mc:evm',
    chain: 'evm',
    rawAddress: '0xAbCdEf0000000000000000000000000000000000',
    publicKey: '04' + '00'.repeat(64),
    derivationPath: "m/44'/60'/0'/0/0"
};
const btcWallet: BtcWallet = {
    id: 'mc:btc',
    chain: 'btc',
    rawAddress: 'bc1qexample00000000000000000000000000000000',
    publicKey: '02' + '00'.repeat(32),
    derivationPath: "m/84'/0'/0'/0/0"
};
const tronWallet: MultichainTronWallet = {
    id: 'mc:tron',
    chain: 'tron',
    rawAddress: 'TXY00000000000000000000000000000000000',
    publicKey: '02' + '00'.repeat(32),
    derivationPath: "m/44'/195'/0'/0/0"
};
const solWallet: SolWallet = {
    id: 'mc:sol',
    chain: 'sol',
    rawAddress: 'So11111111111111111111111111111111111111112',
    publicKey: '00'.repeat(32),
    derivationPath: "m/44'/501'/0'/0'"
};

async function roundTrip<A extends Account>(account: A): Promise<Account> {
    const storage = new JsonStorage();
    // Skip the one-shot MAM/TRON cleanup migration — tests are post-migration
    // by construction, and we want to assert a clean round-trip.
    await storage.set('TRON_MAM_ACCOUNTS_HAS_BEEN_MIGRATED_KEY', true);

    const accountsStorage = new AccountsStorage(storage);
    await accountsStorage.setAccounts([account]);

    const [restored] = await accountsStorage.getAccounts();
    return restored;
}

describe('AccountsStorage — backwards-compat round-trip', () => {
    it('AccountTonMnemonic survives JSON round-trip', async () => {
        const account = AccountTonMnemonic.create({
            id: 'mnemonic-1',
            name: 'Standard',
            emoji: '🐱',
            auth: { kind: 'password', encryptedSecret: 'enc-secret' },
            activeTonWalletId: tonStandardWallet.id,
            tonWallets: [tonStandardWallet],
            mnemonicType: 'ton'
        });

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountTonMnemonic);
        expect(restored).toEqual(account);
        expect((restored as AccountTonMnemonic).tonWallets[0].derivationPath).toBeUndefined();
    });

    it('AccountTonTestnet survives JSON round-trip', async () => {
        const account = AccountTonTestnet.create({
            id: 'testnet-1',
            name: 'Testnet',
            emoji: '🧪',
            auth: { kind: 'keychain', keychainStoreKey: 'key-tn' },
            activeTonWalletId: tonStandardWallet.id,
            tonWallets: [tonStandardWallet],
            mnemonicType: 'bip39'
        });

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountTonTestnet);
        expect(restored).toEqual(account);
    });

    it('AccountTonSK survives JSON round-trip', async () => {
        const account = AccountTonSK.create({
            id: 'sk-1',
            name: 'SK',
            emoji: '🔑',
            auth: { kind: 'password', encryptedSecret: 'enc-sk' },
            activeTonWalletId: tonStandardWallet.id,
            tonWallets: [tonStandardWallet],
            signingAlgorithm: 'ed25519'
        });

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountTonSK);
        expect(restored).toEqual(account);
    });

    it('AccountTonOnly survives JSON round-trip', async () => {
        const account = new AccountTonOnly(
            'signer-1',
            'Signer',
            '✍️',
            { kind: 'signer' },
            tonStandardWallet.id,
            [tonStandardWallet]
        );

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountTonOnly);
        expect(restored).toEqual(account);
    });

    it('AccountTonWatchOnly survives JSON round-trip', async () => {
        const account = new AccountTonWatchOnly('watch-1', 'Watcher', '👀', {
            id: tonStandardWallet.id,
            rawAddress: tonStandardWallet.rawAddress
        });

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountTonWatchOnly);
        expect(restored).toEqual(account);
    });

    it('AccountKeystone survives JSON round-trip', async () => {
        const account = new AccountKeystone(
            'keystone-1',
            'Keystone',
            '🪨',
            undefined,
            tonStandardWallet
        );

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountKeystone);
        expect(restored).toEqual(account);
    });

    it('AccountLedger survives JSON round-trip', async () => {
        const account = new AccountLedger(
            'ledger-1',
            'Ledger',
            '🔒',
            0,
            [0],
            [
                {
                    index: 0,
                    activeTonWalletId: tonStandardWallet.id,
                    tonWallets: [tonStandardWallet]
                }
            ]
        );

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountLedger);
        expect(restored).toEqual(account);
    });

    it('AccountMAM survives JSON round-trip', async () => {
        const account = new AccountMAM(
            'mam-1',
            'MAM',
            '🌳',
            { kind: 'password', encryptedSecret: 'enc-mam' },
            0,
            [0],
            [
                {
                    name: 'Wallet 1',
                    emoji: '🌳',
                    index: 0,
                    activeTonWalletId: tonStandardWallet.id,
                    tonWallets: [tonStandardWallet]
                }
            ]
        );

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountMAM);
        expect(restored).toEqual(account);
    });

    it('AccountTonMultisig survives JSON round-trip', async () => {
        const account = new AccountTonMultisig(
            'multisig-1',
            'Multisig',
            '🤝',
            { id: tonStandardWallet.id, rawAddress: tonStandardWallet.rawAddress },
            [{ address: '0:host', isPinned: true }],
            '0:host'
        );

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountTonMultisig);
        expect(restored).toEqual(account);
    });
});

describe('AccountsStorage — AccountMultichain round-trip', () => {
    it('survives JSON round-trip with all chains', async () => {
        const account = AccountMultichain.create({
            id: 'mc-1',
            name: 'Multi',
            emoji: '🪐',
            auth: { kind: 'keychain', keychainStoreKey: 'mc-key' },
            enabledChains: ['ton', 'evm', 'btc', 'tron', 'sol'],
            activeWalletByChain: {
                ton: tonMultichainWallet.id,
                evm: evmWallet.id,
                btc: btcWallet.id,
                tron: tronWallet.id,
                sol: solWallet.id
            },
            wallets: [tonMultichainWallet, evmWallet, btcWallet, tronWallet, solWallet]
        });

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountMultichain);
        expect(restored).toEqual(account);
        expect((restored as AccountMultichain).getWalletByChain('evm')).toEqual(evmWallet);
        expect((restored as AccountMultichain).activeTonWallet).toEqual(tonMultichainWallet);
        expect((restored as AccountMultichain).activeTonWallet.derivationPath).toBe(
            "m/44'/607'/0'"
        );
    });

    it('survives round-trip with TON-only enabledChains (v1 minimum)', async () => {
        const account = AccountMultichain.create({
            id: 'mc-ton-only',
            name: 'Multi (TON only)',
            emoji: '🟣',
            auth: { kind: 'keychain', keychainStoreKey: 'mc-key' },
            enabledChains: ['ton'],
            activeWalletByChain: { ton: tonMultichainWallet.id },
            wallets: [tonMultichainWallet]
        });

        const restored = await roundTrip(account);

        expect(restored).toBeInstanceOf(AccountMultichain);
        expect(restored).toEqual(account);
        expect((restored as AccountMultichain).getWalletByChain('evm')).toBeUndefined();
    });

    it('restored instance exposes the IAccountTonWalletStandard contract', async () => {
        const account = AccountMultichain.create({
            id: 'mc-contract',
            name: 'Multi',
            emoji: '🪐',
            auth: { kind: 'keychain', keychainStoreKey: 'mc-key' },
            enabledChains: ['ton', 'evm'],
            activeWalletByChain: { ton: tonMultichainWallet.id, evm: evmWallet.id },
            wallets: [tonMultichainWallet, evmWallet]
        });

        const restored = (await roundTrip(account)) as AccountMultichain;

        expect(restored.allTonWallets).toEqual([tonMultichainWallet]);
        expect(restored.getTonWallet(tonMultichainWallet.id)).toEqual(tonMultichainWallet);
        expect(restored.getTonWallet('does-not-exist')).toBeUndefined();
        restored.setActiveTonWallet(tonMultichainWallet.id);
        expect(restored.activeWalletByChain.ton).toBe(tonMultichainWallet.id);
    });
});

describe('AccountsStorage — mixed list', () => {
    let storage: IStorage;
    let accounts: AccountsStorage;

    beforeEach(async () => {
        storage = new JsonStorage();
        await storage.set('TRON_MAM_ACCOUNTS_HAS_BEEN_MIGRATED_KEY', true);
        accounts = new AccountsStorage(storage);
    });

    it('persists a list mixing legacy and multichain accounts in stable order', async () => {
        const legacy = AccountTonMnemonic.create({
            id: 'legacy',
            name: 'Legacy',
            emoji: '🐱',
            auth: { kind: 'password', encryptedSecret: 'enc' },
            activeTonWalletId: tonStandardWallet.id,
            tonWallets: [tonStandardWallet],
            mnemonicType: 'ton'
        });
        const multichain = AccountMultichain.create({
            id: 'multi',
            name: 'Multi',
            emoji: '🪐',
            auth: { kind: 'keychain', keychainStoreKey: 'k' },
            enabledChains: ['ton', 'evm'],
            activeWalletByChain: { ton: tonMultichainWallet.id, evm: evmWallet.id },
            wallets: [tonMultichainWallet, evmWallet]
        });

        await accounts.setAccounts([legacy, multichain]);
        const restored = await accounts.getAccounts();

        expect(restored).toHaveLength(2);
        expect(restored[0]).toBeInstanceOf(AccountTonMnemonic);
        expect(restored[1]).toBeInstanceOf(AccountMultichain);
        expect(restored).toEqual([legacy, multichain]);
    });

    it('AppKey reserves MULTICHAIN_CHAIN_CONFIG and MULTICHAIN_MIGRATION_STATE', () => {
        expect(AppKey.MULTICHAIN_CHAIN_CONFIG).toBe('multichain_chain_config');
        expect(AppKey.MULTICHAIN_MIGRATION_STATE).toBe('multichain_migration_state');
    });
});

describe('AccountsStorage — retired keys', () => {
    it('removes META_ENCRYPTION_MAP on read', async () => {
        const storage = new JsonStorage();
        await storage.set('TRON_MAM_ACCOUNTS_HAS_BEEN_MIGRATED_KEY', true);
        await storage.set(AppKey.META_ENCRYPTION_MAP, { '0:00': {} });

        await new AccountsStorage(storage).getAccounts();

        expect(await storage.get(AppKey.META_ENCRYPTION_MAP)).toBeNull();
    });
});
