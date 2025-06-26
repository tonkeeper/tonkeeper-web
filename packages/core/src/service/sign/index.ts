import { sign } from '@ton/crypto';
import { assertUnreachable } from '../../utils/types';
import { Buffer } from 'buffer';
import nacl from 'tweetnacl';

export type SKSigningAlgorithm = 'ed25519' | 'fireblocks';

export type SigningSecret = { key: string; algorithm: SKSigningAlgorithm };

export async function signWithSecret(message: string | Uint8Array, secret: SigningSecret) {
    const messageBuffer =
        typeof message === 'string' ? Buffer.from(message, 'hex') : Buffer.from(message);

    if (secret.algorithm === 'ed25519') {
        const keyPair = ed25519KeypairFromSeedOrSecretKey(secret.key);
        return sign(messageBuffer, Buffer.from(keyPair.secretKey));
    } else if (secret.algorithm === 'fireblocks') {
        return (await import('./fireblocks')).signWithFireblocksKey(messageBuffer, secret.key);
    } else {
        assertUnreachable(secret.algorithm);
    }
}
export async function publicKeyFromSecret(secret: SigningSecret): Promise<Buffer> {
    if (secret.algorithm === 'ed25519') {
        const pair = ed25519KeypairFromSeedOrSecretKey(secret.key);
        return Buffer.from(pair.publicKey);
    } else if (secret.algorithm === 'fireblocks') {
        return (await import('./fireblocks')).fireblocksSecretToPublicKey(secret.key);
    } else {
        assertUnreachable(secret.algorithm);
    }
}

function ed25519KeypairFromSeedOrSecretKey(seedOrSk: string) {
    if (seedOrSk.length === 64) {
        return nacl.sign.keyPair.fromSeed(Buffer.from(seedOrSk, 'hex'));
    } else if (seedOrSk.length === 128) {
        return nacl.sign.keyPair.fromSecretKey(Buffer.from(seedOrSk, 'hex'));
    } else {
        throw new Error('Wrong secret key sie');
    }
}
