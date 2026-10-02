/* eslint-disable import/no-extraneous-dependencies */
import { mnemonicNew } from '@ton/crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { AccountSecret } from '../../entries/account';
import { decryptWalletSecret, encryptWalletSecret } from '../mnemonicService';

/**
 * Backward-compatibility guard for the TWA recovery stub.
 *
 * Existing Telegram Mini App users have wallet secrets in their per-bot
 * CloudStorage that were written by the old deployed bundle using the legacy
 * v1 encryption (SHA-256(password) → AES-GCM, `<ivHex><ctBase64>`). The stub
 * must be able to decrypt and parse those blobs back into an AccountSecret via
 * decryptWalletSecret. These tests assert that path works for both the legacy
 * v1 format and the current v2 format, for mnemonic and secret-key secrets.
 */
describe('mnemonicService wallet-secret back-compat (TWA stub recovery)', () => {
    const password = 'correct horse battery staple';
    let mnemonic: string[];

    beforeAll(async () => {
        mnemonic = await mnemonicNew();
    });

    it('round-trips a mnemonic secret through the current (v2) format', async () => {
        const secret: AccountSecret = { type: 'mnemonic', mnemonic };
        const blob = await encryptWalletSecret(secret, password);
        const out = await decryptWalletSecret(blob, password);
        expect(out).toEqual(secret);
    });

    it('decrypts a legacy v1 mnemonic blob written by the old deployed TWA', async () => {
        const blob = await legacyEncrypt(mnemonic.join(' '), password);
        const out = await decryptWalletSecret(blob, password);
        expect(out).toEqual({ type: 'mnemonic', mnemonic });
    });

    it('decrypts a legacy v1 secret-key blob written by the old deployed TWA', async () => {
        const sk = 'a'.repeat(128); // 128 hex chars — valid AccountSecret sk
        const blob = await legacyEncrypt(sk, password);
        const out = await decryptWalletSecret(blob, password);
        expect(out).toEqual({ type: 'sk', sk });
    });

    it('fails to decrypt a legacy blob with the wrong password', async () => {
        const blob = await legacyEncrypt(mnemonic.join(' '), password);
        await expect(decryptWalletSecret(blob, 'wrong password')).rejects.toBeDefined();
    });
});

// Verbatim copy of the previous encrypt() (SHA-256(password) → AES-GCM, ivHex+ctBase64),
// used only to produce legacy blobs identical to what the old deployed TWA wrote.
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
