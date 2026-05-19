/**
 * Password-based encryption for wallet secrets.
 *
 * v2 (current): PBKDF2-HMAC-SHA256 → AES-GCM key, random 16-byte salt per secret.
 * Blob format: `v2:<saltHex>:<iterations>:<ivHex>:<ctBase64>`.
 *
 * v1 (legacy, decrypt-only): SHA-256(password) used directly as AES-GCM key, no salt.
 * Blob format: `<ivHex(24)><ctBase64>`. Kept so existing user data still opens; new
 * writes always use v2, and callers can detect legacy blobs via isLegacyEncryptedSecret().
 */

const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_HASH = 'SHA-256';
const SALT_BYTES = 16;
const IV_BYTES = 12;
const AES_KEY_BITS = 256;
const FORMAT_VERSION = 'v2';
const V2_PREFIX = `${FORMAT_VERSION}:`;

export async function encrypt(plaintext: string, password: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveAesKey(password, salt, PBKDF2_ITERATIONS, ['encrypt']);

    const pt = new TextEncoder().encode(plaintext);
    const ctBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, pt);

    return [
        FORMAT_VERSION,
        bytesToHex(salt),
        String(PBKDF2_ITERATIONS),
        bytesToHex(iv),
        bufferToBase64(ctBuffer)
    ].join(':');
}

export async function decrypt(ciphertext: string, password: string): Promise<string> {
    if (isV2EncryptedSecret(ciphertext)) {
        return decryptV2(ciphertext, password);
    }
    return decryptLegacy(ciphertext, password);
}

export function isLegacyEncryptedSecret(ciphertext: string): boolean {
    return !isV2EncryptedSecret(ciphertext);
}

function isV2EncryptedSecret(ciphertext: string): boolean {
    return ciphertext.startsWith(V2_PREFIX);
}

async function decryptV2(ciphertext: string, password: string): Promise<string> {
    const parts = ciphertext.split(':');
    if (parts.length !== 5) {
        throw new Error('Malformed encrypted payload');
    }
    const [, saltHex, iterationsStr, ivHex, ctBase64] = parts;
    const iterations = Number(iterationsStr);
    if (
        !Number.isInteger(iterations) ||
        iterations !== PBKDF2_ITERATIONS ||
        iterationsStr !== String(PBKDF2_ITERATIONS)
    ) {
        throw new Error('Invalid PBKDF2 iteration count');
    }

    const salt = hexToBytes(saltHex);
    const iv = hexToBytes(ivHex);
    const key = await deriveAesKey(password, salt, iterations, ['decrypt']);

    const ct = base64ToBytes(ctBase64);
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(plain);
}

async function deriveAesKey(
    password: string,
    salt: Uint8Array,
    iterations: number,
    usages: KeyUsage[]
): Promise<CryptoKey> {
    const pwBytes = new TextEncoder().encode(password);
    const baseKey = await crypto.subtle.importKey('raw', pwBytes, 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations, hash: PBKDF2_HASH },
        baseKey,
        { name: 'AES-GCM', length: AES_KEY_BITS },
        false,
        usages
    );
}

async function decryptLegacy(ciphertext: string, password: string): Promise<string> {
    const pwUtf8 = new TextEncoder().encode(password);
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);

    const iv = ciphertext
        .slice(0, 24)
        .match(/.{2}/g)!
        .map(byte => parseInt(byte, 16));

    const alg = { name: 'AES-GCM', iv: new Uint8Array(iv) };
    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']);

    const ctStr = atob(ciphertext.slice(24));
    const ctUint8 = new Uint8Array(ctStr.match(/[\s\S]/g)!.map(ch => ch.charCodeAt(0)));

    const plainBuffer = await crypto.subtle.decrypt(alg, key, ctUint8);
    return new TextDecoder().decode(plainBuffer);
}

function bytesToHex(bytes: Uint8Array): string {
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
}

function hexToBytes(hex: string): Uint8Array {
    if (hex.length % 2 !== 0) {
        throw new Error('Invalid hex string');
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
}

function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let str = '';
    for (let i = 0; i < bytes.length; i++) {
        str += String.fromCharCode(bytes[i]);
    }
    return btoa(str);
}

function base64ToBytes(base64: string): Uint8Array {
    const str = atob(base64);
    const bytes = new Uint8Array(str.length);
    for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes;
}
