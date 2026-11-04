import { Network } from './network';
import { Language } from './language';
import { WalletProxy } from './proxy';
import { TronWallet } from './tron/tron-wallet';
import { MultichainTronWallet } from './tron/multichain-tron-wallet';
import { EvmWallet } from './evm/evm-wallet';
import { BtcWallet } from './btc/btc-wallet';
import { SolWallet } from './sol/sol-wallet';
import { DeprecatedAuthState } from './password';
import { Account, AccountMAM, AccountTonMnemonic } from './account';

export enum WalletVersion {
    V3R1 = 0,
    V3R2 = 1,
    V4R1 = 2,
    V4R2 = 3,
    V5_BETA = 4,
    V5R1 = 5
}

export type WalletsTransform = (wallets: ReadonlyArray<TonWalletStandard>) => TonWalletStandard[];

export const getWalletsFromAccount = (
    account: AccountTonMnemonic | AccountMAM,
    transformAllWallets?: WalletsTransform
): AccountWallet[] => {
    if (account.type === 'mam') {
        return account.derivations.map(derivation => ({
            wallet: derivation.tonWallets[0],
            account,
            derivation
        }));
    }

    const immutableWallets = account.allTonWallets as ReadonlyArray<TonWalletStandard>;

    const modifiedWallets = transformAllWallets
        ? transformAllWallets(immutableWallets.slice())
        : immutableWallets.slice();

    return modifiedWallets.sort(sortWalletsByVersion).map(w => ({
        wallet: w,
        account
    }));
};

export function sortWalletsByVersion(
    w1: { version: WalletVersion },
    w2: { version: WalletVersion }
) {
    if (w1.version < w2.version) {
        return 1;
    }
    if (w1.version > w2.version) {
        return -1;
    }
    return 0;
}

export function sortDerivationsByIndex(w1: { index: number }, w2: { index: number }) {
    if (w1.index < w2.index) {
        return -1;
    }
    if (w1.index > w2.index) {
        return 1;
    }
    return 0;
}

export const isW5Version = (version: WalletVersion) => {
    return version === WalletVersion.V5_BETA || version === WalletVersion.V5R1;
};

export const WalletVersions = [
    WalletVersion.V3R1,
    WalletVersion.V3R2,
    WalletVersion.V4R2,
    WalletVersion.V5_BETA,
    WalletVersion.V5R1
];

export const backwardCompatibilityOnlyWalletVersions = [WalletVersion.V5_BETA];

export const walletVersionText = (version: WalletVersion) => {
    switch (version) {
        case WalletVersion.V3R1:
            return 'v3R1';
        case WalletVersion.V3R2:
            return 'v3R2';
        case WalletVersion.V4R2:
            return 'v4R2';
        case WalletVersion.V5_BETA:
            return 'W5 beta';
        case WalletVersion.V5R1:
            return 'W5';
        default:
            return String(version);
    }
};

/**
 * @deprecated
 */
export interface DeprecatedWalletAddress {
    friendlyAddress: string;
    rawAddress: string;
    version: WalletVersion;
}

export interface WalletVoucher {
    secretKey: string;
    publicKey: string;
    sharedKey: string;
    voucher: string;
}

/**
 * @deprecated, use WalletsState instead
 */
export interface DeprecatedWalletState {
    publicKey: string;
    active: DeprecatedWalletAddress;
    auth?: DeprecatedAuthState;

    name?: string;
    emoji?: string;

    revision: number;

    /**
     * @deprecated
     */
    network?: Network;

    hiddenJettons?: string[];
    shownJettons?: string[];
    orderJettons?: string[];

    lang?: Language;
    theme?: string;

    proxy?: WalletProxy;
}

export type WalletId = string;

export type TonContract = {
    id: WalletId;
    rawAddress: string; // rawAddress
};

export type TonWalletStandard = TonContract & {
    publicKey: string;
    version: WalletVersion;
    network?: Network;
    /**
     * Populated on TON wallets created inside an `AccountMultichain`
     * (BIP39 path `m/44'/607'/0'`). Absent on legacy TON-standard / MAM
     * / SK / Ledger / Keystone wallets — those keep their derivation
     * knowledge in account-level fields, not here. Must remain optional
     * so legacy wallets without this field round-trip byte-identical.
     */
    derivationPath?: string;
};

export type DerivationItem = {
    index: number;
    activeTonWalletId: WalletId;
    tonWallets: TonWalletStandard[];
    /**
     * undefined for old wallets
     */
    tronWallet?: TronWallet;
};

export type DerivationItemNamed = DerivationItem & {
    name: string;
    emoji: string;
};

export function isStandardTonWallet(wallet: TonContract): wallet is TonWalletStandard {
    return 'version' in wallet && 'publicKey' in wallet;
}

/**
 * Union of every wallet shape an `AccountMultichain` may hold.
 * `TonWalletStandard` predates the multichain types and lacks an
 * explicit `chain` discriminator — narrow it via `isStandardTonWallet`
 * (or the equivalent `'version' in wallet` test). The four chain-tagged
 * members (`EvmWallet` / `BtcWallet` / `MultichainTronWallet` /
 * `SolWallet`) each carry an explicit `chain` literal and narrow
 * symmetrically.
 *
 * Does not include the legacy `TronWallet` (`{id, address}` at
 * `./tron/tron-wallet.ts`). Legacy TRON is a bolt-on on
 * `AccountTonMnemonic` / `AccountMAM` via `DerivationItem.tronWallet`,
 * not a member of `AccountMultichain.wallets`. The two TRON paths are
 * type-distinct on purpose.
 */
export type MultichainWallet =
    | TonWalletStandard
    | EvmWallet
    | BtcWallet
    | MultichainTronWallet
    | SolWallet;

export function isEvmWallet(wallet: MultichainWallet): wallet is EvmWallet {
    return 'chain' in wallet && wallet.chain === 'evm';
}

export function isBtcWallet(wallet: MultichainWallet): wallet is BtcWallet {
    return 'chain' in wallet && wallet.chain === 'btc';
}

export function isSolWallet(wallet: MultichainWallet): wallet is SolWallet {
    return 'chain' in wallet && wallet.chain === 'sol';
}

/**
 * Narrows to the *multichain* TRON wallet shape — entries inside
 * `AccountMultichain.wallets`. For the legacy `TronWallet` (the
 * `{id, address}` bolt-on on `DerivationItem.tronWallet`), the call site
 * already has a narrowed type — there's no helper needed.
 */
export function isTronWallet(wallet: MultichainWallet): wallet is MultichainTronWallet {
    return 'chain' in wallet && wallet.chain === 'tron';
}

export interface TonWalletConfig {
    pinnedTokens: string[];
    hiddenTokens: string[];
    pinnedNfts: string[];
    hiddenNfts: string[];
    trustedNfts: string[];
    spamNfts: string[];
    batterySettings: {
        enabledForSwaps: boolean;
        enabledForTokens: boolean;
        enabledForNfts: boolean;
    };
    cachedOwnCollectablesNumber?: number;
    cachedHasHistory?: boolean;
}

export const defaultPreferencesConfig: TonWalletConfig = {
    pinnedTokens: [],
    hiddenTokens: [],
    pinnedNfts: [],
    hiddenNfts: [],
    trustedNfts: [],
    spamNfts: [],
    batterySettings: {
        enabledForSwaps: true,
        enabledForTokens: true,
        enabledForNfts: true
    }
};

export interface AccountWallet {
    wallet: TonWalletStandard;
    account: Account;
}

export const addWalletMethod = [
    'multisig',
    'create-standard',
    'import',
    'watch-only',
    'signer',
    'keystone',
    'ledger',
    'testnet',
    'sk_fireblocks'
] as const;
export type AddWalletMethod = (typeof addWalletMethod)[number];
