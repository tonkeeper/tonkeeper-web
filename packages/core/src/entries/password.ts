import { KeystonePathInfo } from '../service/keystone/types';
import { TonWalletStandard } from './wallet';

export type AuthState =
    | AuthPassword
    | AuthKeychain
    | AuthSigner
    | AuthSignerDeepLink
    | AuthLedger
    | AuthKeystone;

export type MnemonicType = 'ton' | 'bip39';
export interface AuthPassword {
    kind: 'password';
    encryptedSecret: string;
}

export interface AuthKeychain {
    kind: 'keychain';

    // currently eq to publicKey
    keychainStoreKey: string;
}

export interface AuthSigner {
    kind: 'signer';
}

export interface AuthSignerDeepLink {
    kind: 'signer-deeplink';
}

export interface AuthLedger {
    kind: 'ledger';
    accountIndex: number;
}

export interface AuthKeystone {
    kind: 'keystone';
    info?: KeystonePathInfo;
}

/**
 * @deprecated
 */
export type DeprecatedAuthState =
    | DeprecatedAuthNone
    | DeprecatedAuthPassword
    | DeprecatedKeychainPassword
    | AuthSigner
    | AuthSignerDeepLink
    | AuthLedger
    | AuthKeystone;

/**
 * @deprecated
 */
export interface DeprecatedAuthNone {
    kind: 'none';
}

/**
 * @deprecated
 */
export interface DeprecatedAuthPassword {
    kind: 'password';
}

/**
 * @deprecated
 */
export interface DeprecatedKeychainPassword {
    kind: 'keychain';
}
