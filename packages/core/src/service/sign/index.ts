import { keyPairFromSecretKey, sign } from '@ton/crypto';
import { assertUnreachable } from '../../utils/types';
import { Buffer } from 'buffer';

export type SKSigningAlgorithm = 'ed25519' | 'fireblocks';

export type SigningSecret = { key: string; algorithm: SKSigningAlgorithm };

export async function signWithSecret(message: string | Uint8Array, secret: SigningSecret) {
    const messageBuffer =
        typeof message === 'string' ? Buffer.from(message, 'hex') : Buffer.from(message);

    if (secret.algorithm === 'ed25519') {
        const keyPair = keyPairFromSecretKey(Buffer.from(secret.key, 'hex'));
        return sign(messageBuffer, keyPair.secretKey);
    } else if (secret.algorithm === 'fireblocks') {
        return (await import('./fireblocks')).signWithFireblocksKey(messageBuffer, secret.key);
    } else {
        assertUnreachable(secret.algorithm);
    }
}
export async function publicKeyFromSecret(secret: SigningSecret): Promise<Buffer> {
    if (secret.algorithm === 'ed25519') {
        const pair = keyPairFromSecretKey(Buffer.from(secret.key, 'hex'));
        return pair.publicKey;
    } else if (secret.algorithm === 'fireblocks') {
        return (await import('./fireblocks')).fireblocksSecretToPublicKey(secret.key);
    } else {
        assertUnreachable(secret.algorithm);
    }
}
