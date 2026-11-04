import { AppKey } from '../../Keys';
import { IStorage } from '../../Storage';
import { ChainKitSessionTokenProvider } from './chainKitClient';
import { multichainApiOrigin } from '../multichainEndpoints';
import {
    base64Decode,
    base64Encode,
    base64UrlDecode,
    be64,
    blake2b256,
    bytesToHex,
    concatBytes,
    hexToBytes,
    lp,
    utf8
} from './proofPrimitives';

/**
 * Device-auth ladder against the multichain backend, mirroring the native
 * apps' `DeviceAuthService`: a per-install ECDSA P-256 keypair ("device
 * certificate") proves ownership of a `device_id`, and the backend mints a
 * short-lived device JWT (15 min) plus a rotating single-use refresh token.
 * The JWT authenticates the node manifest (`GET /api/v1/nodes`) and RPC
 * nodes that require a device token; chain-kit consumes it through the
 * {@link ChainKitSessionTokenProvider} this service implements.
 *
 * Proof format (see the multichain backend OpenAPI spec and chain-kit's
 * `WalletProofHelper`): every message is `LP(domain) ‖ LP(field) ‖ …` where
 * `LP(x) = byte(len(x)) ‖ x`, signed as ES256 — ECDSA P-256 over
 * SHA-256(M) — with the signature as raw `r‖s` hex.
 */

/**
 * Kill switch for the device-auth ladder. When `false`,
 * `getAccessToken()` answers `null`, which both chain-kit and our own
 * manifest fetch treat as "send unauthenticated" (native apps degrade
 * the same way when no session can be established).
 */
export const DEVICE_AUTH_ENABLED = true;

/** Push application id shared by the web-family shells (per backend team). */
export const WEB_PUSH_APP_ID = 2146628909;

export interface DeviceAuthConfig {
    /** Backend `DevicePlatform` value: `web`, `extension`, `desktop`, or `ios_pro`. */
    platform: 'web' | 'extension' | 'desktop' | 'ios_pro';
    /** Push application id, `be64`-framed into the register proof. Immutable per device. */
    appId: number;
    /** Client app version, observability only. */
    clientVersion: string;
}

const devicesUrl = (route: 'challenge' | 'register' | 'refresh'): string =>
    `${multichainApiOrigin()}/api/v2/devices/${route}`;

const DEVICE_REGISTER_DOMAIN = 'keeper.device.register.v1';
const DEVICE_REFRESH_DOMAIN = 'keeper.device.refresh.v1';

/** Renew this many ms before the JWT's declared expiry, matching iOS's leeway. */
const EXPIRY_LEEWAY_MS = 60_000;

interface StoredCertificate {
    /** PKCS#8 private key, base64. */
    privateKey: string;
    /** Compressed P-256 public point, 33 bytes hex — the `device_pub`. */
    publicKey: string;
}

interface StoredTokens {
    deviceId: string;
    /** Single-use rotating token. Never sent in `Authorization`. */
    refreshToken: string;
}

interface DeviceTokensResponse {
    device_id: string;
    device_jwt: string;
    refresh_token: string;
    expires_in: number;
}

interface Session {
    deviceId: string;
    accessToken: string;
    expiresAt: number;
}

/**
 * 401 bodies carry the reason in `{"error": "..."}`: `token_expired`
 * refresh, `refresh_reused` / `device_unknown` re-register with the same
 * keypair, `device_revoked` generate a new one.
 */
class DeviceAuthRejected extends Error {
    constructor(readonly reason: string) {
        super(`device auth rejected: ${reason}`);
    }

    get isDeviceRevoked(): boolean {
        return this.reason.includes('device_revoked');
    }
}

/**
 * WebCrypto exports P-256 public keys as an uncompressed SEC1 point
 * (0x04 ‖ X ‖ Y, 65 bytes); the wire format is the compressed 33-byte
 * point — parity-of-Y prefix ‖ X.
 */
const compressPublicKey = (rawUncompressed: Uint8Array): Uint8Array => {
    if (rawUncompressed.length !== 65 || rawUncompressed[0] !== 0x04) {
        throw new Error('unexpected P-256 public key encoding');
    }
    const x = rawUncompressed.slice(1, 33);
    const yIsOdd = (rawUncompressed[64] & 1) === 1;
    return new Uint8Array([yIsOdd ? 0x03 : 0x02, ...x]);
};

const P256_PARAMS: EcKeyGenParams = { name: 'ECDSA', namedCurve: 'P-256' };
const ES256_SIGN: EcdsaParams = { name: 'ECDSA', hash: 'SHA-256' };

/**
 * ES256 over the message: WebCrypto hashes with SHA-256 internally and
 * returns the raw 64-byte `r‖s` the backend's `es256_raw` proof type takes
 * directly — byte-compatible with chain-kit's
 * `PrivateKey.sign(sha256(M), NIST256p1)` minus the recovery byte.
 */
const signProof = async (privateKey: CryptoKey, message: Uint8Array): Promise<string> => {
    const signature = await crypto.subtle.sign(ES256_SIGN, privateKey, message as BufferSource);
    return bytesToHex(new Uint8Array(signature));
};

export class DeviceAuthService implements ChainKitSessionTokenProvider {
    private current: Session | null = null;

    private inFlight: Promise<Session> | null = null;

    constructor(private readonly storage: IStorage, private readonly config: DeviceAuthConfig) {}

    /** The current device JWT, or `null` when no session can be established. */
    async getAccessToken(): Promise<string | null> {
        if (!DEVICE_AUTH_ENABLED) {
            return null;
        }
        try {
            return (await this.session()).accessToken;
        } catch (e) {
            console.warn('chainkit device auth: no session, requests go out unauthenticated', e);
            return null;
        }
    }

    /**
     * The full session, for callers that need the `device_id` alongside
     * the JWT — the wallet register proof frames both. `null` when no
     * session can be established, same contract as {@link getAccessToken}.
     */
    async getSessionInfo(): Promise<{ deviceId: string; accessToken: string } | null> {
        if (!DEVICE_AUTH_ENABLED) {
            return null;
        }
        try {
            const { deviceId, accessToken } = await this.session();
            return { deviceId, accessToken };
        } catch (e) {
            console.warn('chainkit device auth: no session, requests go out unauthenticated', e);
            return null;
        }
    }

    /**
     * Called once per rejected token. If the session has already moved on,
     * hand back the newer token instead of spending another rotation —
     * the refresh token is single-use and a duplicate renewal would burn
     * the chain (`refresh_reused`).
     */
    async refreshToken(expiredToken: string): Promise<string | null> {
        if (!DEVICE_AUTH_ENABLED) {
            return null;
        }
        if (this.current && this.current.accessToken !== expiredToken) {
            return this.current.accessToken;
        }
        this.current = null;
        return this.getAccessToken();
    }

    private async session(): Promise<Session> {
        if (this.current && this.current.expiresAt - Date.now() > EXPIRY_LEEWAY_MS) {
            return this.current;
        }
        if (!this.inFlight) {
            this.inFlight = this.establishSession().finally(() => {
                this.inFlight = null;
            });
        }
        return this.inFlight;
    }

    private async establishSession(): Promise<Session> {
        let certificate = await this.certificate();

        const stored = await this.storage.get<StoredTokens>(AppKey.MULTICHAIN_DEVICE_TOKENS);
        if (stored) {
            try {
                return await this.refresh(certificate, stored);
            } catch (e) {
                if (!(e instanceof DeviceAuthRejected)) {
                    // Transport or server failure — don't spend a challenge
                    // on a register the same outage would also kill.
                    throw e;
                }
                if (e.isDeviceRevoked) {
                    certificate = await this.regeneratedCertificate();
                }
            }
        }

        try {
            return await this.register(certificate);
        } catch (e) {
            if (e instanceof DeviceAuthRejected && e.isDeviceRevoked) {
                return this.register(await this.regeneratedCertificate());
            }
            throw e;
        }
    }

    private async register(certificate: StoredCertificate): Promise<Session> {
        const challenge = await this.fetchChallenge();
        const devicePub = hexToBytes(certificate.publicKey);
        const message = concatBytes(
            lp(utf8(DEVICE_REGISTER_DOMAIN)),
            lp(devicePub),
            lp(utf8(this.config.platform)),
            lp(be64(this.config.appId)),
            lp(utf8(this.config.clientVersion)),
            lp(base64UrlDecode(challenge))
        );
        const proof = await signProof(await this.privateKey(certificate), message);

        const pair = await this.tokensRequest(devicesUrl('register'), {
            proof_type: 'es256_raw',
            device_pub: certificate.publicKey,
            device_proof: proof,
            challenge,
            platform: this.config.platform,
            app_id: this.config.appId,
            client_version: this.config.clientVersion
        });
        return this.persist(pair);
    }

    private async refresh(certificate: StoredCertificate, stored: StoredTokens): Promise<Session> {
        const message = concatBytes(
            lp(utf8(DEVICE_REFRESH_DOMAIN)),
            lp(utf8(stored.deviceId)),
            lp(blake2b256(utf8(stored.refreshToken)))
        );
        const proof = await signProof(await this.privateKey(certificate), message);

        const pair = await this.tokensRequest(devicesUrl('refresh'), {
            device_id: stored.deviceId,
            refresh_token: stored.refreshToken,
            device_proof: proof
        });
        return this.persist(pair);
    }

    private async fetchChallenge(): Promise<string> {
        const response = await fetch(devicesUrl('challenge'));
        if (!response.ok) {
            throw new Error(`device challenge failed: ${response.status}`);
        }
        const body: { challenge: string } = await response.json();
        return body.challenge;
    }

    private async tokensRequest(url: string, body: object): Promise<DeviceTokensResponse> {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (response.status === 401) {
            const reason = await response
                .json()
                .then((b: { error?: string }) => b.error ?? 'unauthorized')
                .catch(() => 'unauthorized');
            throw new DeviceAuthRejected(reason);
        }
        if (!response.ok) {
            throw new Error(`device auth request failed: ${response.status}`);
        }
        return response.json();
    }

    private async persist(pair: DeviceTokensResponse): Promise<Session> {
        await this.storage.set<StoredTokens>(AppKey.MULTICHAIN_DEVICE_TOKENS, {
            deviceId: pair.device_id,
            refreshToken: pair.refresh_token
        });
        // The JWT itself stays in memory only, per the backend contract.
        this.current = {
            deviceId: pair.device_id,
            accessToken: pair.device_jwt,
            expiresAt: Date.now() + pair.expires_in * 1000
        };
        return this.current;
    }

    private async certificate(): Promise<StoredCertificate> {
        const existing = await this.storage.get<StoredCertificate>(
            AppKey.MULTICHAIN_DEVICE_CERTIFICATE
        );
        if (existing) {
            return existing;
        }
        return this.regeneratedCertificate();
    }

    private async regeneratedCertificate(): Promise<StoredCertificate> {
        const keyPair = await crypto.subtle.generateKey(P256_PARAMS, true, ['sign']);
        const pkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', keyPair.privateKey));
        const raw = new Uint8Array(await crypto.subtle.exportKey('raw', keyPair.publicKey));
        const certificate: StoredCertificate = {
            privateKey: base64Encode(pkcs8),
            publicKey: bytesToHex(compressPublicKey(raw))
        };
        await this.storage.set(AppKey.MULTICHAIN_DEVICE_CERTIFICATE, certificate);
        // The stored pair belongs to the previous certificate and can no
        // longer be proven.
        await this.storage.delete(AppKey.MULTICHAIN_DEVICE_TOKENS);
        return certificate;
    }

    private async privateKey(certificate: StoredCertificate): Promise<CryptoKey> {
        return crypto.subtle.importKey(
            'pkcs8',
            base64Decode(certificate.privateKey) as BufferSource,
            P256_PARAMS,
            false,
            ['sign']
        );
    }
}
