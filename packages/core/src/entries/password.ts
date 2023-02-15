export type AuthState = AuthNone | AuthPassword | WebAuthn;

export interface AuthNone {
  kind: 'none';
}

export interface AuthPassword {
  kind: 'password';
}

export interface WebAuthn {
  kind: 'webauthn';
  type: 'largeBlob' | 'credBlob' | 'userHandle';
  credentialId: string;
  transports?: AuthenticatorTransport[];
}

export const defaultAuthState: AuthState = { kind: 'none' };
