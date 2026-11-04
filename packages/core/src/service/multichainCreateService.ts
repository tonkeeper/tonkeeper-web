import { Network } from '../entries/network';
import { Account, AccountId, AccountMultichain } from '../entries/account';
import { AuthKeychain, AuthPassword, MnemonicType } from '../entries/password';
import {
    isW5Version,
    MultichainWallet,
    WalletId,
    WalletVersion,
    walletVersionText
} from '../entries/wallet';
import { tonAccountType } from './multichainWalletService';
import { EvmWallet } from '../entries/evm/evm-wallet';
import { BtcWallet } from '../entries/btc/btc-wallet';
import { MultichainTronWallet } from '../entries/tron/multichain-tron-wallet';
import { SolWallet } from '../entries/sol/sol-wallet';

import { ChainId, getAdapter, NotImplementedError } from '../chains';
import { loadChainkitWallet } from '../chains/chainkitLoader';
import { DEFAULT_BIP44_PATH } from '../chains/derivation';
import { APIConfig } from '../entries/apis';
import { IStorage } from '../Storage';
import { createStandardTonAccountByMnemonic, getWalletAddress } from './walletService';
import { registerMultichainWalletAndRemember } from './chainkit/multichainApiAuth';
import {
    MultichainRegisterAccount,
    deriveMultichainWalletAuth
} from './chainkit/walletAuthService';

/**
 * Multichain account creation. Bridges the BIP39 mnemonic that lands in
 * the create UI into:
 *
 * 1. A list of per-chain `MultichainWallet` entries with addresses and
 *    pubkeys ready to render and persist.
 * 2. An `AccountMultichain` constructed from those entries plus a
 *    name/emoji/auth bundle that mirrors the legacy
 *    `AccountTonMnemonic` shape.
 *
 * TON is special-cased: addresses are wallet-version-aware, so this
 * service routes TON through the existing
 * `createStandardTonAccountByMnemonic` to reuse `walletContract()` rather
 * than re-implementing the version-aware path. Every other chain goes
 * through the chain-kit adapter (`getAdapter(chain).deriveKeys`).
 *
 * `'sol'` is opportunistically skipped only while chain-kit has no
 * Solana module. Other chain-kit errors must fail account creation so a
 * selected chain is never silently dropped.
 */

interface MultichainCreateContext {
    mainnetApi: APIConfig;
    testnetApi: APIConfig;
    defaultWalletVersion: WalletVersion;
}

const walletIdForChain = (chain: ChainId, rawAddress: string): WalletId => `${chain}:${rawAddress}`;

/**
 * Resolve the TON address + pubkey for the default wallet version. The
 * preview step calls this so the TON entry renders alongside chain-kit
 * derivations. The implementation re-uses `getWalletAddress` to avoid
 * forking the version-aware path that the legacy flow has battle-tested.
 */
export const previewTonAddress = async (
    mnemonic: string[],
    defaultWalletVersion: WalletVersion
): Promise<{ rawAddress: string; publicKey: string }> => {
    const { mnemonicToKeypair } = await import('./mnemonicService');
    const keyPair = await mnemonicToKeypair(mnemonic, 'bip39');
    const publicKey = keyPair.publicKey.toString('hex');
    const { address } = getWalletAddress(publicKey, defaultWalletVersion, Network.MAINNET);
    return { rawAddress: address.toRawString(), publicKey };
};

type NonTonMultichainWallet = EvmWallet | BtcWallet | MultichainTronWallet | SolWallet;

/** What a TON wallet version derived from the phrase currently holds. */
export interface TonImportVersionHoldings {
    version: WalletVersion;
    tonBalance: number;
    hasJettons: boolean;
}

/**
 * The TON version a BIP39 phrase is imported as. A multichain account
 * holds one TON wallet, so the choice decides which funds the user sees:
 * W5 unless only v4R2 is funded, and the user's call when both are. The
 * same rule as iOS' `WalletVersionImportResolver`.
 */
export const resolveMultichainTonImportVersion = (
    holdings: readonly TonImportVersionHoldings[]
): WalletVersion | 'choose' => {
    const isFunded = (version: WalletVersion) =>
        holdings.some(h => h.version === version && (h.tonBalance > 0 || h.hasJettons));
    const v4r2Funded = isFunded(WalletVersion.V4R2);
    const w5Funded = isFunded(WalletVersion.V5R1);
    if (v4r2Funded && w5Funded) return 'choose';
    if (v4r2Funded) return WalletVersion.V4R2;
    return WalletVersion.V5R1;
};

/**
 * The canonical account set a multichain wallet registers with the
 * backend — the same eight rows the native apps send for the same
 * mnemonic, in the same address formats (chain-kit's `display` form,
 * e.g. `UQ…` for TON): both TON versions, BTC segwit, and one address
 * for TRON and each EVM network. Fixed regardless of which chains the
 * user enabled, so the backend indexes one consistent wallet across
 * platforms. Uses the derivation-only web capability — registering a
 * wallet never loads the networked chain-kit SDK.
 */
export const deriveRegisterAccounts = async (
    mnemonic: string[]
): Promise<MultichainRegisterAccount[]> => {
    const wallet = await loadChainkitWallet();
    const phrase = mnemonic.join(' ');
    const address = (chain: string, type?: string): string =>
        wallet.deriveAddress(phrase, chain, type).address;
    return [
        { chain: 'ton', address: address('ton', 'v4r2'), type: 'v4R2' },
        { chain: 'ton', address: address('ton', 'v5r1'), type: 'v5R1' },
        { chain: 'tron', address: address('tron') },
        { chain: 'eth', address: address('eth') },
        { chain: 'btc', address: address('btc', 'segwit'), type: 'p2wpkh' },
        { chain: 'base', address: address('base') },
        { chain: 'bsc', address: address('bsc') },
        { chain: 'arb', address: address('arb') }
    ];
};

/**
 * Build the per-chain wallet objects (with `rawAddress` / `publicKey` /
 * `derivationPath`) for `chains`, *excluding* TON. TON is handled by the
 * caller because its shape is `TonWalletStandard` and its derivation is
 * version-aware. SOL is temporarily skipped when chain-kit reports that
 * the module is not implemented; all other derivation failures propagate.
 */
const deriveNonTonMultichainWallets = async (
    chains: ChainId[],
    mnemonic: string[]
): Promise<NonTonMultichainWallet[]> => {
    const phrase = mnemonic.join(' ');
    const wallets: NonTonMultichainWallet[] = [];
    for (const chain of chains) {
        if (chain === 'ton') continue;
        try {
            const adapter = getAdapter(chain);
            const { address: rawAddress, publicKey } = await adapter.deriveKeys({
                mnemonic: phrase
            });
            const id = walletIdForChain(chain, rawAddress);
            const derivationPath = DEFAULT_BIP44_PATH[chain];
            switch (chain) {
                case 'evm': {
                    const w: EvmWallet = { id, chain, rawAddress, publicKey, derivationPath };
                    wallets.push(w);
                    break;
                }
                case 'btc': {
                    const w: BtcWallet = { id, chain, rawAddress, publicKey, derivationPath };
                    wallets.push(w);
                    break;
                }
                case 'tron': {
                    const w: MultichainTronWallet = {
                        id,
                        chain,
                        rawAddress,
                        publicKey,
                        derivationPath
                    };
                    wallets.push(w);
                    break;
                }
                case 'sol': {
                    const w: SolWallet = { id, chain, rawAddress, publicKey, derivationPath };
                    wallets.push(w);
                    break;
                }
            }
        } catch (e) {
            if (chain === 'sol' && e instanceof NotImplementedError) {
                // Chain-kit gap: leave SOL out of the result until the module lands.
                continue;
            }
            throw e;
        }
    }
    return wallets;
};

/**
 * Build the multichain account end-to-end. Constructs the TON wallet via
 * the legacy `createStandardTonAccountByMnemonic` (mnemonic type
 * `'bip39'` — the seed is a BIP39 phrase) so we inherit the same
 * `id`/`auth`/`name`/`emoji`/`networks` derivation. Then strips the
 * resulting `AccountTonMnemonic` down to its TON wallet and rebuilds an
 * `AccountMultichain` whose `wallets` list includes the per-chain
 * entries derived via chain-kit.
 *
 * `enabledChains` always carries `'ton'` (constructor invariant). The
 * caller's selection is intersected with the chains the adapter could
 * actually derive — a chain the user selected but that chain-kit can't
 * handle (SOL today) is silently dropped from `enabledChains` and
 * `activeWalletByChain`, but the account still creates so the flow
 * doesn't dead-end.
 */
export const createAccountMultichainByMnemonic = async (
    context: MultichainCreateContext,
    storage: IStorage,
    mnemonic: string[],
    options: {
        enabledChains: ChainId[];
        auth: AuthPassword | Omit<AuthKeychain, 'keychainStoreKey'>;
        tonVersion: WalletVersion;
    }
): Promise<AccountMultichain> => {
    const tonAccount = await createStandardTonAccountByMnemonic(
        context,
        storage,
        mnemonic,
        'bip39' as MnemonicType,
        {
            auth: options.auth,
            versions: [options.tonVersion],
            generateTronWallet: false
        }
    );

    const tonWallet = tonAccount.activeTonWallet;
    const nonTonWallets = await deriveNonTonMultichainWallets(options.enabledChains, mnemonic);

    const wallets: MultichainWallet[] = [tonWallet, ...nonTonWallets];

    const activeWalletByChain: Partial<Record<ChainId, WalletId>> = {
        ton: tonWallet.id
    };
    for (const w of nonTonWallets) {
        activeWalletByChain[w.chain] = w.id;
    }

    const enabledChains: ChainId[] = ['ton'];
    for (const chain of options.enabledChains) {
        if (chain === 'ton') continue;
        if (activeWalletByChain[chain]) {
            enabledChains.push(chain);
        }
    }

    const walletAuth = await deriveMultichainWalletAuth(mnemonic);

    // Bind the wallet to this device while the mnemonic is still in
    // hand. A failure must not lose the account — the attempt is
    // remembered and `ensureMultichainWalletRegistered` retries from the
    // stored accounts list next time the wallet's data is requested.
    try {
        const registerAccounts = await deriveRegisterAccounts(mnemonic);
        await registerMultichainWalletAndRemember(storage, walletAuth, registerAccounts);
    } catch (e) {
        console.warn('multichain wallet registration failed, will retry', e);
    }

    return AccountMultichain.create({
        id: tonAccount.id satisfies AccountId,
        name: tonAccount.name,
        emoji: tonAccount.emoji,
        auth: tonAccount.auth,
        enabledChains,
        activeWalletByChain,
        wallets,
        multichainWalletId: walletAuth.walletId,
        walletAuthKey: walletAuth.walletAuthKey
    });
};

/**
 * Id of the account that holds `version` of a seed whose first account
 * took the bare public key as its id. Two accounts of one seed differ only
 * in their TON wallet, so the version is what tells them apart.
 */
export const multichainTonVersionAccountId = (
    publicKey: string,
    version: WalletVersion
): AccountId => `${publicKey}:${tonAccountType(version)}`;

/**
 * Another account of the same seed (same TON public key) that holds
 * `version`, or `account` itself when it already does.
 */
export const findMultichainTonVersionHolder = (
    accounts: readonly Account[],
    account: AccountMultichain,
    version: WalletVersion
): AccountMultichain | undefined => {
    const publicKey = account.activeTonWallet.publicKey;
    return accounts.find(
        (a): a is AccountMultichain =>
            a.type === 'multichain' &&
            a.allTonWallets.some(w => w.publicKey === publicKey && w.version === version)
    );
};

/**
 * The TON version the account's settings offer to add as a sibling
 * account: v4R2 for a W5 account, W5 for any other version — the rule the
 * iOS settings use — or `undefined` once some account of the seed already
 * holds it.
 */
export const addableMultichainTonVersion = (
    accounts: readonly Account[],
    account: AccountMultichain
): WalletVersion | undefined => {
    const candidate = isW5Version(account.activeTonWallet.version)
        ? WalletVersion.V4R2
        : WalletVersion.V5R1;
    return findMultichainTonVersionHolder(accounts, account, candidate) ? undefined : candidate;
};

/**
 * A second account for `source`'s seed that holds `version` of the TON
 * wallet: the same non-TON wallets, auth, backend wallet id and chain
 * set, with only the TON wallet — and so the TON address — differing. The
 * backend already indexes both TON versions under the shared wallet id
 * (see {@link deriveRegisterAccounts}), so no registration is needed.
 * The name carries the version because nothing else tells the two
 * accounts apart in the switcher.
 */
export const createMultichainAccountWithTonVersion = async (
    context: MultichainCreateContext,
    storage: IStorage,
    mnemonic: string[],
    source: AccountMultichain,
    version: WalletVersion
): Promise<AccountMultichain> => {
    const tonAccount = await createStandardTonAccountByMnemonic(
        context,
        storage,
        mnemonic,
        'bip39' as MnemonicType,
        { auth: source.auth, versions: [version], generateTronWallet: false }
    );
    const tonWallet = tonAccount.activeTonWallet;
    if (tonWallet.publicKey !== source.activeTonWallet.publicKey) {
        throw new Error('The mnemonic does not belong to this account');
    }

    const tonWallets = source.allTonWallets;
    const nonTonWallets = source.wallets.filter(
        w => !tonWallets.some(tonWalletOfSource => tonWalletOfSource === w)
    );

    return AccountMultichain.create({
        id: multichainTonVersionAccountId(tonWallet.publicKey, version),
        name: `${source.name} ${walletVersionText(version)}`,
        emoji: source.emoji,
        auth: source.auth,
        enabledChains: source.enabledChains,
        activeWalletByChain: { ...source.activeWalletByChain, ton: tonWallet.id },
        wallets: [tonWallet, ...nonTonWallets],
        multichainWalletId: source.multichainWalletId,
        walletAuthKey: source.walletAuthKey
    });
};
