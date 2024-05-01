export type AuthState =
    | AuthNone
    | AuthPassword
    | WebAuthn
    | KeychainPassword
    | AuthSigner
    | AuthSignerDeepLink;

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

export interface WebAuthn {
    kind: 'webauthn';
    type: 'largeBlob' | 'credBlob' | 'userHandle';
    credentialId: string;
    transports?: AuthenticatorTransport[];
}

export const defaultAuthState: AuthState = { kind: 'none' };
