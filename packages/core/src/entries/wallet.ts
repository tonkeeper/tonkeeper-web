import { Language } from './language';
import { Network } from './network';
import { DeprecatedAuthState } from './password';
import { WalletProxy } from './proxy';

export enum WalletVersion {
    V3R1 = 0,
    V3R2 = 1,
    V4R1 = 2,
    V4R2 = 3,
    V5_BETA = 4,
    V5R1 = 5
}

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

export type TonContract = {
    id: WalletId;
    rawAddress: string; // rawAddress
};

export type TonWalletStandard = TonContract & {
    publicKey: string;
    version: WalletVersion;
};

export type DerivationItem = {
    index: number;
    activeTonWalletId: WalletId;
    tonWallets: TonWalletStandard[];
    //  tronWallets: never;
};

export function isStandardTonWallet(wallet: TonContract): wallet is TonWalletStandard {
    return 'version' in wallet && 'publicKey' in wallet;
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
