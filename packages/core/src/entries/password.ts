export type AuthState =
    | AuthNone
    | AuthPassword
    | WebAuthn
    | KeychainPassword
    | AuthSigner
    | AuthSignerDeepLink
    | AuthLedger
    | AuthKeystone;

export interface AuthNone {
    kind: 'none';
}

export interface AuthPassword {
    kind: 'password';
}

export interface KeychainPassword {
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

export interface KeystonePathInfo {
    path: string;
    xfp: string;
}

export interface WebAuthn {
    kind: 'webauthn';
    type: 'largeBlob' | 'credBlob' | 'userHandle';
    credentialId: string;
    transports?: AuthenticatorTransport[];
}

export const defaultAuthState: AuthState = { kind: 'none' };
