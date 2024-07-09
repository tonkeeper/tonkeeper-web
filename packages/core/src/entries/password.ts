import { KeystonePathInfo } from '../service/keystone/types';

export type AuthState =
    | AuthPassword
    | WebAuthn
    | AuthKeychain
    | AuthSigner
    | AuthSignerDeepLink
    | AuthLedger
    | AuthKeystone;

export interface AuthPassword {
    kind: 'password';
    encryptedMnemonic: string;
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

export interface WebAuthn {
    kind: 'webauthn';
    type: 'largeBlob' | 'credBlob' | 'userHandle';
    credentialId: string;
    transports?: AuthenticatorTransport[];
}

/**
 * @deprecated
 */
export type DeprecatedAuthState =
    | DeprecatedAuthNone
    | DeprecatedAuthPassword
    | WebAuthn
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
