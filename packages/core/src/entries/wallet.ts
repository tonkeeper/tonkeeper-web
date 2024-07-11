import { Language } from './language';
import { Network } from './network';
import { AuthKeychain, AuthPassword, AuthState, DeprecatedAuthState } from './password';
import { WalletProxy } from './proxy';
import { BLOCKCHAIN_NAME } from './crypto';

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

export const defaultWalletVersion = WalletVersion.V5R1;

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

export interface WalletBasic {
    blockchain: BLOCKCHAIN_NAME;
    id: WalletId;
}

export interface TonWalletStateBasic extends WalletBasic {
    blockchain: BLOCKCHAIN_NAME.TON;
    rawAddress: string;
    name: string;
    emoji: string;
    network: Network;
}

export interface StandardTonWalletState extends TonWalletStateBasic {
    type: 'standard';
    publicKey: string;
    version: WalletVersion;
    auth: AuthState;
}

export interface MultisigTonWalletState extends TonWalletStateBasic {
    type: 'multisig';
}

export type TonWalletState = StandardTonWalletState | MultisigTonWalletState;

export type WalletState = TonWalletState;
export type WalletsState = WalletState[];

export const defaultWalletsState = [];

export function isTonWallet(state: WalletState): state is TonWalletState {
    return state.blockchain === BLOCKCHAIN_NAME.TON;
}

export function isStandardTonWallet(state: WalletState): state is StandardTonWalletState {
    return state.blockchain === BLOCKCHAIN_NAME.TON && state.type === 'standard';
}

export function isPasswordAuthWallet(
    state: WalletState
): state is WalletState & { auth: AuthPassword } {
    return isStandardTonWallet(state) && state.auth.kind === 'password';
}

export function isMnemonicAuthWallet(
    state: WalletState
): state is WalletState & { auth: AuthPassword | AuthKeychain } {
    return (
        isStandardTonWallet(state) &&
        (state.auth.kind === 'password' || state.auth.kind === 'keychain')
    );
}

export interface ActiveWalletConfig {
    pinnedTokens: string[];
    hiddenTokens: string[];
    pinnedNfts: string[];
    hiddenNfts: string[];
    trustedNfts: string[];
    spamNfts: string[];
}

export interface TronWalletStorage {
    ownerWalletAddress: string;
    walletByChain: Record<string, string>;
}

export interface TronWalletState {
    ownerWalletAddress: string;
    chainId: string;
    walletAddress: string;
}
