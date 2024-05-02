export type AuthState =
    | AuthNone
    | AuthPassword
    | WebAuthn
    | KeychainPassword
    | AuthSigner
    | AuthLedger;

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

export interface AuthLedger {
    kind: 'ledger';
    accountIndex: number;
}

export interface WebAuthn {
    kind: 'webauthn';
    type: 'largeBlob' | 'credBlob' | 'userHandle';
    credentialId: string;
    transports?: AuthenticatorTransport[];
}

export const defaultAuthState: AuthState = { kind: 'none' };
