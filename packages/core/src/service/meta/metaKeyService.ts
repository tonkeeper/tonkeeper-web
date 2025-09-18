import nacl, { SignKeyPair } from 'tweetnacl';
import { pbkdf2_sha512 } from '@ton/crypto';

async function hmacSHA512(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key.slice(),
        {
            name: 'HMAC',
            hash: { name: 'SHA-512' }
        },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data.slice());

    return new Uint8Array(signature);
}

export async function tonSeedPhraseToEd25519Seed(seed: string) {
    const hash = await hmacSHA512(new TextEncoder().encode(seed), new Uint8Array(0));

    const p = await pbkdf2_sha512(
        Buffer.from(hash),
        Buffer.from('TON seed version'),
        Math.floor(100000 / 256),
        1
    );

    if (p[0] !== 0) {
        throw new Error('invalid seed');
    }

    const walletMainEd22519Seed = await pbkdf2_sha512(
        Buffer.from(hash),
        Buffer.from('TON default seed'),
        100000,
        32
    );

    return { walletMainEd22519Seed };
}

export async function sha512(data: Uint8Array): Promise<Uint8Array> {
    const buf = await crypto.subtle.digest('SHA-512', data.slice());
    return new Uint8Array(buf);
}

export async function createEncryptionKey(walletMainEd22519Seed: Buffer) {
    const data = new Uint8Array([...new TextEncoder().encode('meta'), ...walletMainEd22519Seed]);

    const derived = await sha512(data);

    const walletMetaEncryptionEd25519Seed = derived.slice(0, 32);
    const walletMetaEncryptionPrivateKey = nacl.sign.keyPair.fromSeed(
        walletMetaEncryptionEd25519Seed
    );
    return { walletMetaEncryptionEd25519Seed, walletMetaEncryptionPrivateKey };
}

export function createEncryptionCertificate(
    walletMetaEncryptionPrivateKey: SignKeyPair,
    walletMainPrivateKey: SignKeyPair
) {
    const certPayload = Buffer.concat([
        Buffer.from('meta'),
        Buffer.from(walletMetaEncryptionPrivateKey.publicKey)
    ]);
    const signature = nacl.sign.detached(certPayload, walletMainPrivateKey.secretKey);
    const cert = Buffer.concat([certPayload, Buffer.from(signature)]);
    return { cert };
}
