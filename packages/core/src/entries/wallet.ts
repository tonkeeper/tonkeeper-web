import { FiatCurrencies } from './fiat';
import { Language } from './language';
import { Network } from './network';
import { AuthState } from './password';
import { WalletProxy } from './proxy';

export enum WalletVersion {
    V3R1 = 0,
    V3R2 = 1,
    V4R1 = 2,
    V4R2 = 3,
    W5 = 4
}

export const WalletVersions = [WalletVersion.V3R1, WalletVersion.V3R2, WalletVersion.V4R2];

export const walletVersionText = (version: WalletVersion) => {
    switch (version) {
        case WalletVersion.V3R1:
            return 'v3R1';
        case WalletVersion.V3R2:
            return 'v3R2';
        case WalletVersion.V4R2:
            return 'v4R2';
        case WalletVersion.W5:
            return 'W5';
        default:
            return String(version);
    }
};

export const walletVersionFromText = (value: string) => {
    switch (value) {
        case 'v3R1':
            return WalletVersion.V3R1;
        case 'v3R2':
            return WalletVersion.V3R2;
        case 'v4R2':
            return WalletVersion.V4R2;
        case 'W5':
            return WalletVersion.W5;
        default:
            throw new Error('Unsupported version');
    }
};

export interface WalletAddress {
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

export interface WalletState {
    publicKey: string;
    active: WalletAddress;
    auth?: AuthState;

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

export interface TronWalletStorage {
    ownerWalletAddress: string;
    walletByChain: Record<string, string>;
}

export interface TronWalletState {
    ownerWalletAddress: string;
    chainId: string;
    walletAddress: string;
}
