import { KeystonePathInfo } from '../service/keystone/types';

export type AuthState =
    | AuthPassword
    | WebAuthn
    | AuthKeychain
    | AuthSigner
    | AuthSignerDeepLink
    | AuthLedger
    | AuthKeystone;

export interface AuthNone {
    kind: 'none';
}

export interface AuthPassword {
    kind: 'password';
    encryptedMnemonic: string;
}

export interface AuthKeychain {
    kind: 'keychain';
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

export const defaultAuthState: DeprecatedAuthState = { kind: 'none' };

/**
 * @deprecated
 */
export type DeprecatedAuthState =
    | AuthNone
    | DeprecatedAuthPassword
    | WebAuthn
    | DeprecatedKeychainPassword
    | AuthSigner
    | AuthSignerDeepLink
    | AuthLedger
    | AuthKeystone;

export interface DeprecatedAuthPassword {
    kind: 'password';
}

export interface DeprecatedKeychainPassword {
    kind: 'keychain';
}
