/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { decrypt, encrypt, isLegacyEncryptedSecret } from '../cryptoService';

describe('cryptoService', () => {
    const password = 'correct horse battery staple';
    const plaintext = 'word '.repeat(23) + 'final';

    it('roundtrips plaintext through encrypt/decrypt', async () => {
        const blob = await encrypt(plaintext, password);
        const out = await decrypt(blob, password);
        expect(out).toBe(plaintext);
    });

    it('writes the v2 format with salt, iterations, iv and ciphertext', async () => {
        const blob = await encrypt(plaintext, password);
        const parts = blob.split(':');
        expect(parts).toHaveLength(5);
        const [version, saltHex, iterations, ivHex, ctBase64] = parts;
        expect(version).toBe('v2');
        expect(saltHex).toMatch(/^[0-9a-f]{32}$/);
        expect(Number(iterations)).toBeGreaterThanOrEqual(600_000);
        expect(ivHex).toMatch(/^[0-9a-f]{24}$/);
        expect(ctBase64.length).toBeGreaterThan(0);
    });

    it('uses a fresh salt and iv per encryption', async () => {
        const a = await encrypt(plaintext, password);
        const b = await encrypt(plaintext, password);
        expect(a).not.toBe(b);

        const [, saltA, , ivA] = a.split(':');
        const [, saltB, , ivB] = b.split(':');
        expect(saltA).not.toBe(saltB);
        expect(ivA).not.toBe(ivB);
    });

    it('rejects an incorrect password', async () => {
        const blob = await encrypt(plaintext, password);
        await expect(decrypt(blob, 'wrong password')).rejects.toBeDefined();
    });

    it('rejects a tampered ciphertext (AES-GCM auth tag)', async () => {
        const blob = await encrypt(plaintext, password);
        const parts = blob.split(':');
        const ct = parts[4];
        const flipped = ct.slice(0, ct.length - 4) + (ct.endsWith('A') ? 'B===' : 'A===');
        parts[4] = flipped;
        await expect(decrypt(parts.join(':'), password)).rejects.toBeDefined();
    });

    it('decrypts legacy SHA-256(password) blobs produced by the old encrypt()', async () => {
        const legacyBlob = await legacyEncrypt(plaintext, password);
        expect(isLegacyEncryptedSecret(legacyBlob)).toBe(true);
        const out = await decrypt(legacyBlob, password);
        expect(out).toBe(plaintext);
    });

    it('flags v2 blobs as not-legacy', async () => {
        const blob = await encrypt(plaintext, password);
        expect(isLegacyEncryptedSecret(blob)).toBe(false);
    });

    it('rejects malformed v2 payloads', async () => {
        await expect(decrypt('v2:nope', password)).rejects.toBeDefined();
    });

    it('rejects unsupported v2 iteration counts before deriving a key', async () => {
        const blob = await encrypt(plaintext, password);
        const parts = blob.split(':');
        parts[2] = '600001';

        await expect(decrypt(parts.join(':'), password)).rejects.toThrow(
            'Invalid PBKDF2 iteration count'
        );
    });

    it('rejects non-canonical v2 iteration counts', async () => {
        const blob = await encrypt(plaintext, password);
        const parts = blob.split(':');
        parts[2] = '0600000';

        await expect(decrypt(parts.join(':'), password)).rejects.toThrow(
            'Invalid PBKDF2 iteration count'
        );
    });
});

// Verbatim copy of the previous encrypt() (SHA-256(password) → AES-GCM, ivHex+ctBase64).
// Used only to produce a legacy blob so we can test decrypt() back-compat.
async function legacyEncrypt(plaintext: string, password: string): Promise<string> {
    const pwUtf8 = new TextEncoder().encode(password);
    const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const alg = { name: 'AES-GCM', iv };
    const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']);
    const ptUint8 = new TextEncoder().encode(plaintext);
    const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8);
    const ctArray = Array.from(new Uint8Array(ctBuffer));
    const ctStr = ctArray.map(byte => String.fromCharCode(byte)).join('');
    const ctBase64 = btoa(ctStr);
    const ivHex = Array.from(iv)
        .map(b => ('00' + b.toString(16)).slice(-2))
        .join('');
    return ivHex + ctBase64;
}
