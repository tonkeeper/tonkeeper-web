/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// walletService + mnemonicService import `@ton-keychain/{core,trx}` at module
// load; those ship ESM that breaks under vitest's Node loader. The BIP39
// create path doesn't touch `@ton-keychain/core` (bip39 keypair derivation is
// pure), but `createPayloadOfStandardTonAccount` always computes the *legacy*
// TRON bolt-on via `TronAddressUtils.hexToBase58` — even though we pass
// `generateTronWallet: false` and discard it. Stub just that one fn.
vi.mock('@ton-keychain/core', () => ({}));
vi.mock('@ton-keychain/trx', () => ({
    TronAddressUtils: { hexToBase58: (hex: string) => `T${hex.replace(/^0x/, '')}` }
}));

import * as chains from '../../chains';
import { ChainAdapter } from '../../chains';
import { APIConfig } from '../../entries/apis';
import { WalletVersion } from '../../entries/wallet';
import {
    isBtcWallet,
    isEvmWallet,
    isSolWallet,
    isTronWallet,
    isStandardTonWallet
} from '../../entries/wallet';
import { IStorage } from '../../Storage';
import {
    addableMultichainTonVersion,
    createAccountMultichainByMnemonic,
    createMultichainAccountWithTonVersion,
    findMultichainTonVersionHolder,
    multichainTonVersionAccountId,
    previewTonAddress,
    resolveMultichainTonImportVersion
} from '../multichainCreateService';

beforeAll(() => chains.ensureReady());
afterEach(() => vi.restoreAllMocks());

/** Round-trips values through JSON, mirroring the platform storages. The
 * create flow only reads it for `getNewAccountNameAndEmoji` (empty → default
 * name/emoji), so a fresh instance per test is enough. */
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
        for (const [k, v] of Object.entries(values)) this.store.set(k, JSON.stringify(v));
        return values;
    };

    delete = async <R>(key: string): Promise<R | null> => {
        const current = await this.get<R>(key);
        this.store.delete(key);
        return current;
    };

    clear = async (): Promise<void> => this.store.clear();
}

const CANONICAL_BIP39 =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(
        ' '
    );

// `versions` is always passed in the create flow, so `findWalletAddress`
// (the only network-touching branch) is skipped — the API configs are never
// read. Empty stubs keep the test offline.
const context = {
    mainnetApi: {} as APIConfig,
    testnetApi: {} as APIConfig,
    defaultWalletVersion: WalletVersion.V5R1
};

const auth = { kind: 'password', encryptedSecret: 'test-encrypted' } as const;

describe('createAccountMultichainByMnemonic', () => {
    it('builds a multichain account with TON + EVM + BTC + TRON wallets', async () => {
        const account = await createAccountMultichainByMnemonic(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            {
                enabledChains: ['ton', 'evm', 'btc', 'tron'],
                auth,
                tonVersion: WalletVersion.V5R1
            }
        );

        expect(account.type).toBe('multichain');
        expect(account.enabledChains).toEqual(['ton', 'evm', 'btc', 'tron']);

        // One wallet per enabled chain; TON is a TonWalletStandard, the rest
        // carry their chain discriminator.
        expect(account.wallets.filter(isStandardTonWallet)).toHaveLength(1);
        expect(account.wallets.filter(isEvmWallet)).toHaveLength(1);
        expect(account.wallets.filter(isBtcWallet)).toHaveLength(1);
        expect(account.wallets.filter(isTronWallet)).toHaveLength(1);

        // activeWalletByChain points at a real wallet for every enabled chain.
        for (const chain of account.enabledChains) {
            const id = account.activeWalletByChain[chain];
            expect(id).toBeDefined();
            expect(account.wallets.some(w => w.id === id)).toBe(true);
        }

        // EVM/BTC/TRON addresses match the pinned canonical-vector fixtures.
        expect(account.wallets.find(isEvmWallet)!.rawAddress).toBe(
            '0x9858EfFD232B4033E47d90003D41EC34EcaEda94'
        );
        expect(account.wallets.find(isBtcWallet)!.rawAddress).toBe(
            'bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu'
        );
        expect(account.wallets.find(isTronWallet)!.rawAddress).toBe(
            'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH'
        );
    });

    it("forces 'ton' into enabledChains even if the caller omits it", async () => {
        const account = await createAccountMultichainByMnemonic(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            { enabledChains: ['evm'], auth, tonVersion: WalletVersion.V5R1 }
        );
        expect(account.enabledChains[0]).toBe('ton');
        expect(account.enabledChains).toContain('evm');
        expect(account.activeWalletByChain.ton).toBeDefined();
    });

    it("drops 'sol' — chain-kit has no Solana module — without failing the flow", async () => {
        const account = await createAccountMultichainByMnemonic(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            { enabledChains: ['ton', 'sol'], auth, tonVersion: WalletVersion.V5R1 }
        );
        expect(account.enabledChains).not.toContain('sol');
        expect(account.wallets.filter(isSolWallet)).toHaveLength(0);
        expect(account.activeWalletByChain.sol).toBeUndefined();
    });

    it('rethrows non-SOL chain-kit derivation failures instead of dropping the chain', async () => {
        const failure = new Error('chain-kit wasm failed');
        const adapter: ChainAdapter = {
            chain: 'evm',
            validateAddress: () => true,
            formatAmount: () => '0',
            parseAmount: () => 0n,
            deriveKeys: vi.fn().mockRejectedValue(failure),
            estimateFee: vi.fn().mockResolvedValue({ amount: 0n }),
            buildTransaction: vi.fn().mockResolvedValue({}),
            signTransaction: vi.fn().mockResolvedValue({}),
            broadcast: vi.fn().mockResolvedValue({ hash: '0x0' })
        };
        vi.spyOn(chains, 'getAdapter').mockReturnValue(adapter);

        await expect(
            createAccountMultichainByMnemonic(context, new JsonStorage(), CANONICAL_BIP39, {
                enabledChains: ['ton', 'evm'],
                auth,
                tonVersion: WalletVersion.V5R1
            })
        ).rejects.toThrow('chain-kit wasm failed');
    });

    it('passes the auth bundle through to the account untouched', async () => {
        const account = await createAccountMultichainByMnemonic(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            { enabledChains: ['ton'], auth, tonVersion: WalletVersion.V5R1 }
        );
        expect(account.auth).toEqual(auth);
    });
});

describe('previewTonAddress', () => {
    it('derives a raw TON address and hex pubkey for the default version', async () => {
        const { rawAddress, publicKey } = await previewTonAddress(
            CANONICAL_BIP39,
            WalletVersion.V5R1
        );
        expect(rawAddress).toMatch(/^0:[0-9a-f]{64}$/);
        expect(publicKey).toMatch(/^[0-9a-f]+$/);
    });

    it('matches the TON wallet the create flow stores', async () => {
        const { rawAddress } = await previewTonAddress(CANONICAL_BIP39, WalletVersion.V5R1);
        const account = await createAccountMultichainByMnemonic(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            { enabledChains: ['ton'], auth, tonVersion: WalletVersion.V5R1 }
        );
        expect(account.activeTonWallet.rawAddress).toBe(rawAddress);
    });
});

describe('resolveMultichainTonImportVersion', () => {
    const holdings = (
        v4r2: Partial<{ ton: number; jettons: boolean }>,
        w5: Partial<{ ton: number; jettons: boolean }>
    ) => [
        {
            version: WalletVersion.V4R2,
            tonBalance: v4r2.ton ?? 0,
            hasJettons: v4r2.jettons ?? false
        },
        { version: WalletVersion.V5R1, tonBalance: w5.ton ?? 0, hasJettons: w5.jettons ?? false },
        { version: WalletVersion.V3R2, tonBalance: 5, hasJettons: true }
    ];

    it('defaults to W5 when neither W5 nor v4R2 holds anything', () => {
        expect(resolveMultichainTonImportVersion(holdings({}, {}))).toBe(WalletVersion.V5R1);
        expect(resolveMultichainTonImportVersion([])).toBe(WalletVersion.V5R1);
    });

    it('keeps W5 when only W5 is funded', () => {
        expect(resolveMultichainTonImportVersion(holdings({}, { ton: 1 }))).toBe(
            WalletVersion.V5R1
        );
    });

    it('imports v4R2 when only v4R2 is funded, by coin or by tokens', () => {
        expect(resolveMultichainTonImportVersion(holdings({ ton: 1 }, {}))).toBe(
            WalletVersion.V4R2
        );
        expect(resolveMultichainTonImportVersion(holdings({ jettons: true }, {}))).toBe(
            WalletVersion.V4R2
        );
    });

    it('asks the user when both are funded', () => {
        expect(resolveMultichainTonImportVersion(holdings({ ton: 1 }, { jettons: true }))).toBe(
            'choose'
        );
    });
});

describe('createMultichainAccountWithTonVersion', () => {
    const createSource = () =>
        createAccountMultichainByMnemonic(context, new JsonStorage(), CANONICAL_BIP39, {
            enabledChains: ['ton', 'evm', 'btc', 'tron'],
            auth,
            tonVersion: WalletVersion.V5R1
        });

    it('builds a sibling that differs from the source only in its TON wallet', async () => {
        const source = await createSource();
        const twin = await createMultichainAccountWithTonVersion(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            source,
            WalletVersion.V4R2
        );

        expect(twin.id).toBe(
            multichainTonVersionAccountId(source.activeTonWallet.publicKey, WalletVersion.V4R2)
        );
        expect(twin.id).not.toBe(source.id);
        expect(twin.activeTonWallet.version).toBe(WalletVersion.V4R2);
        expect(twin.activeTonWallet.rawAddress).not.toBe(source.activeTonWallet.rawAddress);
        expect(twin.activeTonWallet.publicKey).toBe(source.activeTonWallet.publicKey);
        expect(twin.allTonWallets).toHaveLength(1);

        const nonTon = (a: typeof source) =>
            a.wallets.filter(w => !a.allTonWallets.some(t => t.id === w.id));
        expect(nonTon(twin)).toEqual(nonTon(source));
        expect(twin.enabledChains).toEqual(source.enabledChains);
        expect(twin.multichainWalletId).toBe(source.multichainWalletId);
        expect(twin.walletAuthKey).toBe(source.walletAuthKey);
        expect(twin.auth).toEqual(source.auth);
        expect(twin.emoji).toBe(source.emoji);
        expect(twin.name).toBe(`${source.name} v4R2`);
    });

    it('offers the missing version and stops once a sibling holds it', async () => {
        const source = await createSource();
        expect(addableMultichainTonVersion([source], source)).toBe(WalletVersion.V4R2);

        const twin = await createMultichainAccountWithTonVersion(
            context,
            new JsonStorage(),
            CANONICAL_BIP39,
            source,
            WalletVersion.V4R2
        );
        expect(addableMultichainTonVersion([source, twin], source)).toBeUndefined();
        expect(addableMultichainTonVersion([source, twin], twin)).toBeUndefined();
        expect(findMultichainTonVersionHolder([source, twin], twin, WalletVersion.V5R1)).toBe(
            source
        );
        expect(addableMultichainTonVersion([twin], twin)).toBe(WalletVersion.V5R1);
    });
});
