import nacl from 'tweetnacl';
import { KeyPair } from '@ton/crypto';
import { IMetaEncryptionData } from '../../entries/wallet';

export function createEncryptionCertificate(
    walletMetaKeyPair: KeyPair,
    walletMainPrivateKey: KeyPair
): Buffer {
    const certPayload = Buffer.concat([Buffer.from('meta'), walletMetaKeyPair.publicKey]);
    const signature = nacl.sign.detached(certPayload, walletMainPrivateKey.secretKey);

    return Buffer.concat([certPayload, Buffer.from(signature)]);
}

export const createFakeMetaEncryptionData = (): IMetaEncryptionData => {
    const metaKeyPair = nacl.sign.keyPair();
    const walletKeyPair = nacl.sign.keyPair();

    const certificate = createEncryptionCertificate(
        {
            publicKey: Buffer.from(metaKeyPair.publicKey),
            secretKey: Buffer.from(metaKeyPair.secretKey)
        },
        {
            publicKey: Buffer.from(walletKeyPair.publicKey),
            secretKey: Buffer.from(walletKeyPair.secretKey)
        }
    );

    return {
        keyPair: {
            publicKey: Buffer.from(metaKeyPair.publicKey),
            secretKey: Buffer.from(metaKeyPair.secretKey)
        },
        certificate
    };
};
