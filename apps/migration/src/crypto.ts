/**
 * Opens the password-encrypted vaults this origin's wallets left behind. It is
 * the read half of `packages/core/src/service/cryptoService.ts`, restated for
 * the same reason as the storage keys — this app builds without
 * `@tonkeeper/core`, so that no wallet code can reach the bundle served here.
 *
 * Both blob formats are read, because both are still on disk out there:
 *
 *   v2  `v2:<saltHex>:<iterations>:<ivHex>:<ctBase64>` — PBKDF2 → AES-GCM.
 *   v1  `<ivHex(24)><ctBase64>` — SHA-256(password) used directly as the key.
 *
 * The one thing written here is a v2 copy of a v1 vault, for the handoff: the
 * v1 key is an unsalted SHA-256 of the password, so a v1 blob must never leave
 * this origin as it is. Decryption is pure client-side crypto, so the whole
 * reveal works with no connection — and a wrong password simply fails the
 * AES-GCM tag.
 */

const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const V2_PREFIX = 'v2:';

/** Mirrors `AccountSecret` in `packages/core/src/entries/account.ts`. */
export type AccountSecret = { type: 'mnemonic'; mnemonic: string[] } | { type: 'sk'; sk: string };

const SK_OR_SEED_PATTERN = /^([0-9a-f]{128}|[0-9a-f]{64})$/i;

export const isLegacyVault = (encryptedSecret: string): boolean =>
    !encryptedSecret.startsWith(V2_PREFIX);

const decryptVault = (encryptedSecret: string, password: string): Promise<string> =>
    isLegacyVault(encryptedSecret)
        ? decryptLegacy(encryptedSecret, password)
        : decryptV2(encryptedSecret, password);

/**
 * The same plaintext under today's format, byte for byte, so the wallet on the
 * other side opens it exactly as it would have opened the original.
 */
export const reencryptLegacyVault = async (
    encryptedSecret: string,
    password: string
): Promise<string> => encryptV2(await decryptLegacy(encryptedSecret, password), password);

export const decryptSecret = async (
    encryptedSecret: string,
    password: string
): Promise<AccountSecret> => {
    const secret = await decryptVault(encryptedSecret, password);

    // The AES-GCM tag has already vouched for the plaintext, so the shape is
    // all that is left to tell a raw key from a phrase — unlike the wallet,
    // this app carries no wordlist to validate the words against.
    return SK_OR_SEED_PATTERN.test(secret)
        ? { type: 'sk', sk: secret }
        : { type: 'mnemonic', mnemonic: secret.split(/\s+/).filter(Boolean) };
};

const pbkdf2Key = async (password: string, salt: Uint8Array, usage: KeyUsage): Promise<CryptoKey> =>
    crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
            'deriveKey'
        ]),
        { name: 'AES-GCM', length: 256 },
        false,
        [usage]
    );

/** Mirrors `encrypt` in `packages/core/src/service/cryptoService.ts`. */
const encryptV2 = async (plaintext: string, password: string): Promise<string> => {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await pbkdf2Key(password, salt, 'encrypt');
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(plaintext)
    );

    return [
        'v2',
        bytesToHex(salt),
        String(PBKDF2_ITERATIONS),
        bytesToHex(iv),
        bytesToBase64(new Uint8Array(ciphertext))
    ].join(':');
};

const decryptV2 = async (ciphertext: string, password: string): Promise<string> => {
    const parts = ciphertext.split(':');

    if (parts.length !== 5) {
        throw new Error('Malformed encrypted payload');
    }

    const [, saltHex, iterations, ivHex, ctBase64] = parts;

    if (iterations !== String(PBKDF2_ITERATIONS)) {
        throw new Error('Invalid PBKDF2 iteration count');
    }

    const key = await pbkdf2Key(password, hexToBytes(saltHex), 'decrypt');

    return decryptAesGcm(key, hexToBytes(ivHex), base64ToBytes(ctBase64));
};

const decryptLegacy = async (ciphertext: string, password: string): Promise<string> => {
    const passwordHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
    const key = await crypto.subtle.importKey('raw', passwordHash, 'AES-GCM', false, ['decrypt']);

    return decryptAesGcm(
        key,
        hexToBytes(ciphertext.slice(0, 24)),
        base64ToBytes(ciphertext.slice(24))
    );
};

const decryptAesGcm = async (
    key: CryptoKey,
    iv: Uint8Array,
    ciphertext: Uint8Array
): Promise<string> => {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

    return new TextDecoder().decode(plain);
};

const hexToBytes = (hex: string): Uint8Array => {
    if (hex.length % 2 !== 0) {
        throw new Error('Invalid hex string');
    }

    const bytes = new Uint8Array(hex.length / 2);

    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }

    return bytes;
};

const bytesToHex = (bytes: Uint8Array): string =>
    Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');

const bytesToBase64 = (bytes: Uint8Array): string => {
    let binary = '';

    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
};
