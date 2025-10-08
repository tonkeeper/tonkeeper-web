import nacl from 'tweetnacl';
import { KeyPair } from '@ton/crypto';

export function createEncryptionCertificate(
    walletMetaKeyPair: KeyPair,
    walletMainPrivateKey: KeyPair
): Buffer {
    const certPayload = Buffer.concat([Buffer.from('meta'), walletMetaKeyPair.publicKey]);
    const signature = nacl.sign.detached(certPayload, walletMainPrivateKey.secretKey);

    return Buffer.concat([certPayload, Buffer.from(signature)]);
}
