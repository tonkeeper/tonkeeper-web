import { Language } from './language';
import { Network } from './network';
import {
    AuthKeychain,
    AuthPassword,
    AuthSigner,
    AuthSignerDeepLink,
    DeprecatedAuthState
} from './password';
import { WalletProxy } from './proxy';
import { assertUnreachable } from '../utils/types';
import { KeystonePathInfo } from '../service/keystone/types';

export enum WalletVersion {
    V3R1 = 0,
    V3R2 = 1,
    V4R1 = 2,
    V4R2 = 3,
    V5_BETA = 4,
    V5R1 = 5
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
    emoji: string;

    revision: number;

    network?: Network;

    hiddenJettons?: string[];
    shownJettons?: string[];
    orderJettons?: string[];

    lang?: Language;
    theme?: string;

    proxy?: WalletProxy;

    tron?: TronWalletStorage;
}

export type WalletId = string;
export type AccountId = string;

export type TonContract = {
    id: WalletId;
    rawAddress: string; // rawAddress
};

export type TonWalletStandard = TonContract & {
    name: string;
    emoji: string;
    publicKey: string;
    version: WalletVersion;
};

export type DerivationItem = {
    index: number;
    name: string;
    emoji: string;
    activeTonWalletId: WalletId;
    tonWallets: TonWalletStandard[];
    //  tronWallets: never;
};

export interface AccountBasic {
    emoji: string;
    name: string;
}

export type AccountTonMnemonic = AccountBasic & {
    id: AccountId; // ton public key
    type: 'mnemonic';
    auth: AuthPassword | AuthKeychain;

    activeTonWalletId: WalletId;
    tonWallets: TonWalletStandard[];
    //   tronWallet: never;
};

export type AccountLedger = AccountBasic & {
    id: AccountId; // first acc public key
    type: 'ledger';

    activeDerivationIndex: number;
    derivations: DerivationItem[];
};

export type AccountKeystone = AccountBasic & {
    id: AccountId; // ton wallet id
    type: 'keystone';
    pathInfo?: KeystonePathInfo;

    tonWallet: TonWalletStandard;
};

/**
 * temporary, will be removed when signer supports tron
 */
export type AccountTonOnly = AccountBasic & {
    id: AccountId; // ton wallet id
    type: 'ton-only';
    auth: AuthSigner | AuthSignerDeepLink;

    activeTonWalletId: WalletId;
    tonWallets: TonWalletStandard[];
};

export type AccountTonMultisig = AccountBasic & {
    id: AccountId;
    type: 'multisig';

    //  tonWallet: TonContract;
    //...
};

export type AccountKeeperMnemonic = AccountBasic & {
    id: AccountId;
    type: 'root-mnemonic';
    auth: AuthPassword | AuthKeychain;

    derivations: DerivationItem[];
};

export type Account = AccountTonMnemonic | AccountLedger | AccountTonOnly | AccountKeystone; //| AccountTonMultisig; // | AccountKeeperMnemonic;

export type AccountsState = Account[];

export const defaultAccountState = [];

export function isAccountTonMnemonic(account: Account): account is AccountTonMnemonic {
    return account.type === 'mnemonic';
}

export function isAccountLedger(account: Account): account is AccountLedger {
    return account.type === 'ledger';
}

export function isAccountTonOnly(account: Account): account is AccountTonOnly {
    return account.type === 'ton-only';
}

export function isStandardTonWallet(wallet: TonContract): wallet is TonWalletStandard {
    return 'version' in wallet && 'publicKey' in wallet;
}

export function getWalletById(
    accounts: Account[],
    walletId: WalletId
): TonWalletStandard | undefined {
    for (const account of accounts || []) {
        const wallet = getAccountAllTonWallets(account).find(w => w.id === walletId);
        if (wallet) {
            return wallet;
        }
    }
}

export function getAccountAllTonWallets(account: Account): TonWalletStandard[] {
    if (account.type === 'mnemonic') {
        return account.tonWallets;
    }

    if (account.type === 'ledger') {
        return account.derivations.flatMap(d => d.tonWallets);
    }

    if (account.type === 'ton-only') {
        return account.tonWallets;
    }

    if (account.type === 'keystone') {
        return [account.tonWallet];
    }

    assertUnreachable(account);
}

export function getAccountActiveDerivationTonWallets(account: Account): TonWalletStandard[] {
    if (account.type === 'mnemonic') {
        return account.tonWallets;
    }

    if (account.type === 'ledger') {
        return account.derivations.find(d => account.activeDerivationIndex === d.index)!.tonWallets;
    }

    if (account.type === 'ton-only') {
        return account.tonWallets;
    }

    if (account.type === 'keystone') {
        return [account.tonWallet];
    }

    assertUnreachable(account);
}

export function getAccountActiveTonWallet(account: Account): TonWalletStandard {
    if (account.type === 'mnemonic' || account.type === 'ton-only') {
        return account.tonWallets.find(w => w.id === account.activeTonWalletId)!;
    }

    if (account.type === 'ledger') {
        const derivation = account.derivations.find(
            d => d.index === account.activeDerivationIndex
        )!;
        return derivation.tonWallets.find(w => w.id === derivation.activeTonWalletId)!;
    }

    if (account.type === 'keystone') {
        return account.tonWallet;
    }

    assertUnreachable(account);
}

export function accountWithUpdatedTonWallet(
    account: Account,
    tonWallet: TonWalletStandard
): Account {
    const newAcc: Account = JSON.parse(JSON.stringify(account));
    if (newAcc.type === 'mnemonic' || newAcc.type === 'ton-only') {
        const index = newAcc.tonWallets.findIndex(w => w.id === tonWallet.id)!;
        newAcc.tonWallets[index] = tonWallet;
        return newAcc;
    }

    if (newAcc.type === 'ledger') {
        for (const derivation of newAcc.derivations) {
            const index = derivation.tonWallets.findIndex(w => w.id === tonWallet.id)!;
            if (index !== -1) {
                derivation.tonWallets[index] = tonWallet;
                return newAcc;
            }
        }

        throw new Error('Derivation not found');
    }

    if (newAcc.type === 'keystone') {
        newAcc.tonWallet = tonWallet;
        return newAcc;
    }

    assertUnreachable(newAcc);
}

export function accountWithUpdatedActiveTonWalletId(account: Account, walletId: WalletId): Account {
    const newAcc: Account = JSON.parse(JSON.stringify(account));
    if (newAcc.type === 'mnemonic' || newAcc.type === 'ton-only') {
        newAcc.activeTonWalletId = walletId;
        return newAcc;
    }

    if (newAcc.type === 'ledger') {
        for (const derivation of newAcc.derivations) {
            const index = derivation.tonWallets.findIndex(w => w.id === walletId)!;
            if (index !== -1) {
                derivation.activeTonWalletId = walletId;
                return newAcc;
            }
        }

        throw new Error('Derivation not found');
    }

    if (newAcc.type === 'keystone') {
        return newAcc;
    }

    assertUnreachable(newAcc);
}

export function accountWithAddedTonWallet(account: Account, tonWallet: TonWalletStandard): Account {
    const newAcc: Account = JSON.parse(JSON.stringify(account));
    if (newAcc.type === 'mnemonic' || newAcc.type === 'ton-only') {
        newAcc.tonWallets.push(tonWallet);
        return newAcc;
    }

    if (newAcc.type === 'ledger') {
        const derivation = newAcc.derivations.find(d => d.index === newAcc.activeDerivationIndex)!;
        derivation.tonWallets.push(tonWallet);
        return newAcc;
    }

    if (newAcc.type === 'keystone') {
        throw new Error('Cannot add ton wallet to keystone account');
    }

    assertUnreachable(newAcc);
}

export interface TonWalletConfig {
    pinnedTokens: string[];
    hiddenTokens: string[];
    pinnedNfts: string[];
    hiddenNfts: string[];
    trustedNfts: string[];
    spamNfts: string[];
}

export const defaultPreferencesConfig: TonWalletConfig = {
    pinnedTokens: [],
    hiddenTokens: [],
    pinnedNfts: [],
    hiddenNfts: [],
    trustedNfts: [],
    spamNfts: []
};

export interface TronWalletStorage {
    ownerWalletAddress: string;
    walletByChain: Record<string, string>;
}

export interface TronWalletState {
    ownerWalletAddress: string;
    chainId: string;
    walletAddress: string;
}
