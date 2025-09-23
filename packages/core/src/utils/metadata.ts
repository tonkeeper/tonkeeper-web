import {
    IMetaEncryptionData,
    MetaEncryptionSerializedMap,
    ISerializedMetaEncryptionData
} from '../entries/wallet';

export function serializeMetaKey(data: IMetaEncryptionData): ISerializedMetaEncryptionData {
    return {
        keyPair: {
            publicKey: Buffer.from(data.keyPair.publicKey).toString('base64'),
            secretKey: Buffer.from(data.keyPair.secretKey).toString('base64')
        },
        certificate: data.certificate.toString('base64')
    };
}

export function deserializeMetaKey(serialized: ISerializedMetaEncryptionData): IMetaEncryptionData {
    return {
        keyPair: {
            publicKey: new Uint8Array(Buffer.from(serialized.keyPair.publicKey, 'base64')),
            secretKey: new Uint8Array(Buffer.from(serialized.keyPair.secretKey, 'base64'))
        },
        certificate: Buffer.from(serialized.certificate, 'base64')
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
