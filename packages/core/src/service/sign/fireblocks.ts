import { Buffer } from 'buffer';
import { ExtendedPoint, CURVE as edCURVE, etc } from '@noble/ed25519';
import { bytesToNumberLE, concatBytes, numberToBytesLE, hexToNumber } from '@noble/curves/utils';
import { sha512 as _sha512 } from '@ton/crypto';

/**
 * Generate a Fireblocks EdDSA signature for a given message and private key.
 *
 * @param message string or byte array to sign
 * @param fireblocksSK hex-encoded private key
 * @returns Fireblocks EdDSA signature
 */
export async function signWithFireblocksKey(message: Buffer, fireblocksSK: string) {
    const privateKeyInt = hexToNumber(fireblocksSK);
    const privateKeyBytes = numberToBytesLE(privateKeyInt, 32);
    const messageBytes = concatBytes(message);

    const seed = Buffer.from(fireblocksSK, 'hex');

    const nonceDigest = await sha512(seed, privateKeyBytes, messageBytes);
    const nonce = etc.mod(bytesToNumberLE(nonceDigest), edCURVE.n);

    const R = ExtendedPoint.BASE.multiply(nonce);

    const serializedR = R.toRawBytes();
    const serializedA = fireblocksSecretToPublicKey(fireblocksSK);

    const hramDigest = await sha512(serializedR, serializedA, messageBytes);
    const hram = etc.mod(bytesToNumberLE(hramDigest), edCURVE.n);

    const s = etc.mod(hram * privateKeyInt + nonce, edCURVE.n);
    return Buffer.from(concatBytes(serializedR, numberToBytesLE(s, 32)));
}

export function fireblocksSecretToPublicKey(fireblocksSK: string): Buffer {
    const privateKeyInt = hexToNumber(fireblocksSK);
    const A = ExtendedPoint.BASE.multiply(privateKeyInt);
    return Buffer.from(A.toRawBytes());
}

const sha512 = async (...messages: Uint8Array[]) => {
    const buffer = concatBytes(...messages);

    return _sha512(Buffer.from(buffer));
};
