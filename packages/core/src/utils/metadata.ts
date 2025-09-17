import {
    IMetaEncryptionData,
    MetaEncryptionSerializedMap,
    ISerializedMetaEncryptionData
} from '../entries/wallet';

export function serializeMetaKey(data: IMetaEncryptionData): ISerializedMetaEncryptionData {
    return {
        encryptionPrivateKey: {
            publicKey: Buffer.from(data.encryptionPrivateKey.publicKey).toString('base64'),
            secretKey: Buffer.from(data.encryptionPrivateKey.secretKey).toString('base64')
        },
        encryptionCertificate: data.encryptionCertificate.toString('base64')
    };
}

export function deserializeMetaKey(serialized: ISerializedMetaEncryptionData): IMetaEncryptionData {
    return {
        encryptionPrivateKey: {
            publicKey: new Uint8Array(
                Buffer.from(serialized.encryptionPrivateKey.publicKey, 'base64')
            ),
            secretKey: new Uint8Array(
                Buffer.from(serialized.encryptionPrivateKey.secretKey, 'base64')
            )
        },
        encryptionCertificate: Buffer.from(serialized.encryptionCertificate, 'base64')
    };
}

export const metaEncryptionMapSerializer = (map: MetaEncryptionSerializedMap | null) => {
    if (!map) return null;

    const result: Record<string, IMetaEncryptionData> = {};

    for (const [addr, serialized] of Object.entries(map)) {
        result[addr] = deserializeMetaKey(serialized);
    }

    return result;
};
