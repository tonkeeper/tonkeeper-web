import nacl, { SignKeyPair } from 'tweetnacl';
import { sha512 } from '@ton/crypto';

export async function createEncryptionKey(walletMainEd22519Seed: Buffer) {
    const data = Buffer.concat([Buffer.from('meta', 'utf-8'), walletMainEd22519Seed]);

    const derived = await sha512(data);

    const walletMetaEd25519Seed = derived.subarray(0, 32);

    return nacl.sign.keyPair.fromSeed(walletMetaEd25519Seed);
}

export function createEncryptionCertificate(
    walletMetaKeyPair: SignKeyPair,
    walletMainPrivateKey: SignKeyPair
) {
    const certPayload = Buffer.concat([
        Buffer.from('meta'),
        Buffer.from(walletMetaKeyPair.publicKey)
    ]);
    const signature = nacl.sign.detached(certPayload, walletMainPrivateKey.secretKey);

    return Buffer.concat([certPayload, Buffer.from(signature)]);
}
