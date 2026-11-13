/* eslint-disable import/no-extraneous-dependencies */
import { blake2b } from '@noble/hashes/blake2b';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppKey } from '../../../Keys';
import { MemoryStorage } from '../../../Storage';
import { DeviceAuthService } from '../deviceAuthService';

const PLATFORM = 'web' as const;
const APP_ID = 2146628909;
const CLIENT_VERSION = '4.0.0';

const CHALLENGE_URL = 'https://multi.tonkeeper.com/api/v2/devices/challenge';
const REGISTER_URL = 'https://multi.tonkeeper.com/api/v2/devices/register';
const REFRESH_URL = 'https://multi.tonkeeper.com/api/v2/devices/refresh';

/** base64url (unpadded) of 73 deterministic bytes — the wire challenge shape. */
const challengeValue = (seed: number): string => {
    const bytes = new Uint8Array(73).map((_, i) => (i * 7 + seed) & 0xff);
    return Buffer.from(bytes).toString('base64url');
};

const utf8 = (value: string): Uint8Array => new TextEncoder().encode(value);

const hexToBytes = (hex: string): Uint8Array => {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
};

const lp = (value: Uint8Array): Uint8Array => new Uint8Array([value.length, ...value]);

const concat = (...chunks: Uint8Array[]): Uint8Array => {
    const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
};

const be64 = (value: number): Uint8Array => {
    const out = new Uint8Array(8);
    new DataView(out.buffer).setBigUint64(0, BigInt(value));
    return out;
};

/* P-256 curve constants, for decompressing the wire public key. */
const P = BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff');
const B = BigInt('0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b');

const modPow = (base: bigint, exp: bigint, mod: bigint): bigint => {
    let result = 1n;
    let b = base % mod;
    let e = exp;
    while (e > 0n) {
        if (e & 1n) result = (result * b) % mod;
        b = (b * b) % mod;
        e >>= 1n;
    }
    return result;
};

const bigintTo32 = (value: bigint): Uint8Array => hexToBytes(value.toString(16).padStart(64, '0'));

/** 33-byte compressed point → 65-byte uncompressed, y from the curve equation. */
const decompressP256 = (compressed: Uint8Array): Uint8Array => {
    const x = BigInt(`0x${Buffer.from(compressed.slice(1)).toString('hex')}`);
    const ySquared = (((modPow(x, 3n, P) - ((3n * x) % P) + B) % P) + P) % P;
    let y = modPow(ySquared, (P + 1n) / 4n, P);
    const wantOdd = compressed[0] === 0x03;
    if (((y & 1n) === 1n) !== wantOdd) {
        y = P - y;
    }
    return new Uint8Array([0x04, ...bigintTo32(x), ...bigintTo32(y)]);
};

/** Check the raw r‖s ES256 proof against the message the spec says was signed. */
const verifyProof = async (
    devicePubHex: string,
    proofHex: string,
    message: Uint8Array
): Promise<boolean> => {
    const key = await crypto.subtle.importKey(
        'raw',
        decompressP256(hexToBytes(devicePubHex)) as BufferSource,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        ['verify']
    );
    return crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        hexToBytes(proofHex) as BufferSource,
        message as BufferSource
    );
};

interface RecordedCall {
    url: string;
    body?: Record<string, string | number>;
    headers: Headers;
}

interface Route {
    status: number;
    json: unknown;
}

let calls: RecordedCall[];
let routes: Record<string, Route[]>;

const enqueue = (url: string, status: number, json: unknown) => {
    (routes[url] ??= []).push({ status, json });
};

const enqueueTokens = (jwt: string, refreshToken: string, deviceId = 'device-1') => {
    enqueue(REGISTER_URL, 200, {
        device_id: deviceId,
        device_jwt: jwt,
        refresh_token: refreshToken,
        expires_in: 900
    });
};

const callsTo = (url: string) => calls.filter(c => c.url === url);

beforeEach(() => {
    calls = [];
    routes = {};
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
        const body = init?.body ? JSON.parse(init.body as string) : undefined;
        calls.push({ url, body, headers: new Headers(init?.headers) });
        const route = routes[url]?.shift();
        if (!route) throw new Error(`unexpected fetch: ${url}`);
        return new Response(JSON.stringify(route.json), { status: route.status });
    });
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

const makeService = (storage: MemoryStorage) =>
    new DeviceAuthService(storage, {
        platform: PLATFORM,
        appId: APP_ID,
        clientVersion: CLIENT_VERSION
    });

const registerFirstSession = async (storage: MemoryStorage) => {
    enqueue(CHALLENGE_URL, 200, { challenge: challengeValue(1) });
    enqueueTokens('jwt-1', 'refresh-1');
    const service = makeService(storage);
    const token = await service.getAccessToken();
    return { service, token };
};

describe('DeviceAuthService', () => {
    it('registers on first use and signs a verifiable register proof', async () => {
        const storage = new MemoryStorage();
        const { token } = await registerFirstSession(storage);

        expect(token).toBe('jwt-1');
        const [register] = callsTo(REGISTER_URL);
        expect(register.body).toMatchObject({
            proof_type: 'es256_raw',
            platform: PLATFORM,
            app_id: APP_ID,
            client_version: CLIENT_VERSION,
            challenge: challengeValue(1)
        });
        expect(register.body!.device_pub).toMatch(/^[a-f0-9]{66}$/);
        expect(register.body!.device_proof).toMatch(/^[a-f0-9]{128}$/);

        const message = concat(
            lp(utf8('keeper.device.register.v1')),
            lp(hexToBytes(register.body!.device_pub as string)),
            lp(utf8(PLATFORM)),
            lp(be64(APP_ID)),
            lp(utf8(CLIENT_VERSION)),
            lp(new Uint8Array(Buffer.from(challengeValue(1), 'base64url')))
        );
        await expect(
            verifyProof(
                register.body!.device_pub as string,
                register.body!.device_proof as string,
                message
            )
        ).resolves.toBe(true);
    });

    it('sends the install id as F when it registers the device', async () => {
        const storage = new MemoryStorage();
        await storage.set(AppKey.USER_ID, 'install-1');
        await registerFirstSession(storage);

        const [register] = callsTo(REGISTER_URL);
        expect(register.headers.get('F')).toBe('install-1');
    });

    it('persists the rotating pair but keeps the JWT out of storage', async () => {
        const storage = new MemoryStorage();
        await registerFirstSession(storage);

        expect(await storage.get(AppKey.MULTICHAIN_DEVICE_TOKENS)).toEqual({
            deviceId: 'device-1',
            refreshToken: 'refresh-1'
        });
        expect(JSON.stringify(storage.storage)).not.toContain('jwt-1');
    });

    it('serves the cached session without another request', async () => {
        const storage = new MemoryStorage();
        const { service } = await registerFirstSession(storage);
        const requestsAfterRegister = calls.length;

        await expect(service.getAccessToken()).resolves.toBe('jwt-1');
        expect(calls.length).toBe(requestsAfterRegister);
    });

    it('refreshes with the stored token and signs a verifiable refresh proof', async () => {
        const storage = new MemoryStorage();
        await registerFirstSession(storage);
        const registeredPub = callsTo(REGISTER_URL)[0].body!.device_pub as string;

        enqueue(REFRESH_URL, 200, {
            device_id: 'device-1',
            device_jwt: 'jwt-2',
            refresh_token: 'refresh-2',
            expires_in: 900
        });
        await expect(makeService(storage).getAccessToken()).resolves.toBe('jwt-2');

        const [refresh] = callsTo(REFRESH_URL);
        expect(refresh.body).toMatchObject({
            device_id: 'device-1',
            refresh_token: 'refresh-1'
        });
        const message = concat(
            lp(utf8('keeper.device.refresh.v1')),
            lp(utf8('device-1')),
            lp(blake2b(utf8('refresh-1'), { dkLen: 32 }))
        );
        await expect(
            verifyProof(registeredPub, refresh.body!.device_proof as string, message)
        ).resolves.toBe(true);
        expect(await storage.get(AppKey.MULTICHAIN_DEVICE_TOKENS)).toMatchObject({
            refreshToken: 'refresh-2'
        });
    });

    it('re-registers with the same keypair when the device is unknown', async () => {
        const storage = new MemoryStorage();
        await registerFirstSession(storage);
        const registeredPub = callsTo(REGISTER_URL)[0].body!.device_pub as string;

        enqueue(REFRESH_URL, 401, { error: 'device_unknown' });
        enqueue(CHALLENGE_URL, 200, { challenge: challengeValue(2) });
        enqueueTokens('jwt-2', 'refresh-2');

        await expect(makeService(storage).getAccessToken()).resolves.toBe('jwt-2');
        expect(callsTo(REGISTER_URL)[1].body!.device_pub).toBe(registeredPub);
    });

    it('regenerates the certificate when the device is revoked', async () => {
        const storage = new MemoryStorage();
        await registerFirstSession(storage);
        const registeredPub = callsTo(REGISTER_URL)[0].body!.device_pub as string;

        enqueue(REFRESH_URL, 401, { error: 'device_revoked' });
        enqueue(CHALLENGE_URL, 200, { challenge: challengeValue(2) });
        enqueueTokens('jwt-2', 'refresh-2', 'device-2');

        await expect(makeService(storage).getAccessToken()).resolves.toBe('jwt-2');
        expect(callsTo(REGISTER_URL)[1].body!.device_pub).not.toBe(registeredPub);
    });

    it('does not spend a register attempt on a transport failure', async () => {
        const storage = new MemoryStorage();
        await registerFirstSession(storage);

        enqueue(REFRESH_URL, 500, {});
        await expect(makeService(storage).getAccessToken()).resolves.toBeNull();
        expect(callsTo(REGISTER_URL)).toHaveLength(1);
    });

    it('hands back the newer token instead of rotating the refresh chain twice', async () => {
        const storage = new MemoryStorage();
        const { service } = await registerFirstSession(storage);
        const requestsAfterRegister = calls.length;

        await expect(service.refreshToken('stale-jwt')).resolves.toBe('jwt-1');
        expect(calls.length).toBe(requestsAfterRegister);
    });
});
