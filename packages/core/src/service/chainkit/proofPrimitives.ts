import { blake2b } from '@noble/hashes/blake2b';

/**
 * Byte-level primitives for the multichain backend's proof formats,
 * shared by the device-auth ladder ({@link ./deviceAuthService}) and the
 * wallet-auth stack ({@link ./walletAuthService}). Every message the
 * backend verifies is framed as `LP(field) ‖ LP(field) ‖ …` where
 * `LP(x) = byte(len(x)) ‖ x` — see chain-kit's `WalletProofHelper`,
 * which pins these layouts with cross-language test vectors.
 */

export const bytesToHex = (bytes: Uint8Array): string =>
    Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

export const hexToBytes = (hex: string): Uint8Array => {
    const out = new Uint8Array(hex.length / 2);
    for (let i = 0; i < out.length; i++) {
        out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
};

export const utf8 = (value: string): Uint8Array => new TextEncoder().encode(value);

export const base64Encode = (bytes: Uint8Array): string => {
    let bin = '';
    bytes.forEach(b => {
        bin += String.fromCharCode(b);
    });
    return btoa(bin);
};

export const base64Decode = (value: string): Uint8Array =>
    Uint8Array.from(atob(value), c => c.charCodeAt(0));

/** Challenges travel base64url unpadded; proofs frame the decoded bytes. */
export const base64UrlDecode = (value: string): Uint8Array => {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    return base64Decode(normalized + '='.repeat((4 - (normalized.length % 4)) % 4));
};

/** base64url without padding — the wallet-auth token wire form. */
export const base64UrlEncodeNoPad = (bytes: Uint8Array): string =>
    base64Encode(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * `LP(x)` = one length byte + x. A field over 255 bytes would silently
 * frame a different message, so it's rejected; unbounded values are
 * hashed to 32 bytes before framing.
 */
export const lp = (value: Uint8Array): Uint8Array => {
    if (value.length > 0xff) {
        throw new Error(`proof field must be at most 255 bytes, got ${value.length}`);
    }
    return new Uint8Array([value.length, ...value]);
};

export const concatBytes = (...chunks: Uint8Array[]): Uint8Array => {
    const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        out.set(chunk, offset);
        offset += chunk.length;
    }
    return out;
};

/** Fixed-width big-endian uint64, the spec's `be64(app_id)`. */
export const be64 = (value: number): Uint8Array => {
    const out = new Uint8Array(8);
    new DataView(out.buffer).setBigUint64(0, BigInt(value));
    return out;
};

export const blake2b256 = (data: Uint8Array): Uint8Array => blake2b(data, { dkLen: 32 });

export const blake2b160 = (data: Uint8Array): Uint8Array => blake2b(data, { dkLen: 20 });

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567';

/**
 * RFC 4648 base32, lowercase, no padding — the format-2 wallet id
 * encoding. The trailing partial group is zero-padded on the right, so
 * a 22-byte id always ends in `a` or `q`; the backend rejects any other
 * spelling of the same bytes.
 */
export const base32LowerNoPad = (bytes: Uint8Array): string => {
    let out = '';
    let buffer = 0;
    let bits = 0;
    for (const b of bytes) {
        buffer = (buffer << 8) | b;
        bits += 8;
        while (bits >= 5) {
            out += BASE32_ALPHABET[(buffer >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) {
        out += BASE32_ALPHABET[(buffer << (5 - bits)) & 31];
    }
    return out;
};
