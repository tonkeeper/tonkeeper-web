import * as crypto from 'crypto';

const ED25519_CURVE = 'ed25519 seed';
const HARDENED_OFFSET = 0x80000000;

const pathRegex = new RegExp("^m(\\/[0-9]+')+$");

const replaceDerive = (val: string): string => val.replace("'", '');

type Keys = {
    key: Buffer;
    chainCode: Buffer;
};

const getMasterKeyFromSeed = (seed: string): Keys => {
    const hmac = crypto.createHmac('sha512', ED25519_CURVE);
    const I = hmac.update(Buffer.from(seed, 'hex')).digest();
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    return {
        key: IL,
        chainCode: IR
    };
};

const CKDPriv = ({ key, chainCode }: Keys, index: number): Keys => {
    const indexBuffer = Buffer.allocUnsafe(4);
    indexBuffer.writeUInt32BE(index, 0);

    const data = Buffer.concat([Buffer.alloc(1, 0), key, indexBuffer]);

    const I = crypto.createHmac('sha512', chainCode).update(data).digest();
    const IL = I.slice(0, 32);
    const IR = I.slice(32);
    return {
        key: IL,
        chainCode: IR
    };
};

const isValidPath = (path: string): boolean => {
    if (!pathRegex.test(path)) {
        return false;
    }
    return !path
        .split('/')
        .slice(1)
        .map(replaceDerive)
        .some(isNaN as unknown as (x: string) => boolean);
};

export const deriveED25519Path = (path: string, seed: string, offset = HARDENED_OFFSET): Keys => {
    if (!isValidPath(path)) {
        throw new Error('Invalid derivation path');
    }

    const { key, chainCode } = getMasterKeyFromSeed(seed);
    const segments = path
        .split('/')
        .slice(1)
        .map(replaceDerive)
        // eslint-disable-next-line radix
        .map(el => parseInt(el, 10));

    return segments.reduce((parentKeys, segment) => CKDPriv(parentKeys, segment + offset), {
        key,
        chainCode
    });
};
