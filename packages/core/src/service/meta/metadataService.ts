import * as aesjs from 'aes-js';
import { hmac_sha512 } from '@ton/crypto';
import { Address, beginCell, Builder, Cell } from '@ton/core';

const getRandomPrefix = (dataLength: number, minPadding: number): Buffer => {
    const prefixLength = ((minPadding + 15 + dataLength) & -16) - dataLength;
    const prefix = Buffer.from(crypto.getRandomValues(new Uint8Array(prefixLength)));
    prefix[0] = prefixLength;

    if ((prefixLength + dataLength) % 16 !== 0) throw new Error();

    return prefix;
};

const combineSecrets = async (a: Buffer, b: Buffer): Promise<Buffer> => {
    return hmac_sha512(a, b);
};

const getAesCbcState = async (hash: Uint8Array) => {
    if (hash.length < 48) throw new Error();
    const key = hash.slice(0, 32);
    const iv = hash.slice(32, 32 + 16);

    return new aesjs.ModeOfOperation.cbc(key, iv);
};

export const makeSnakeCells = (bytes: Uint8Array) => {
    const ROOT_CELL_BYTE_LENGTH = 35 + 1;
    const CELL_BYTE_LENGTH = 127;

    const cellCount = 1 + Math.ceil((bytes.length - ROOT_CELL_BYTE_LENGTH) / CELL_BYTE_LENGTH);
    if (cellCount > 16) {
        throw new Error('Text too long');
    }

    const cells: Builder[] = [];

    const root = beginCell();
    root.storeBuffer(Buffer.from(bytes.slice(0, Math.min(bytes.length, ROOT_CELL_BYTE_LENGTH))));
    cells.push(root);

    for (let i = 1; i < cellCount; i++) {
        const cell = beginCell();
        const cursor = ROOT_CELL_BYTE_LENGTH + (i - 1) * CELL_BYTE_LENGTH;
        cell.storeBuffer(
            Buffer.from(bytes.slice(cursor, Math.min(bytes.length, cursor + CELL_BYTE_LENGTH)))
        );
        cells.push(cell);
    }

    for (let i = cells.length - 2; i >= 0; i--) {
        cells[i].storeRef(cells[i + 1]);
    }

    return cells[0].endCell();
};

export const encryptMeta = async (
    meta: string | undefined,
    sender: Address,
    myPrivateKey: Buffer
) => {
    if (!meta?.length) throw new Error('empty comment');

    if (myPrivateKey.length === 64) {
        myPrivateKey = myPrivateKey.subarray(0, 32);
    }

    const metaBytes = Buffer.from(meta, 'utf8');
    const salt = Buffer.from(
        sender.toString({
            urlSafe: true,
            bounceable: true,
            testOnly: false
        }),
        'utf-8'
    );

    const prefix = getRandomPrefix(metaBytes.length, 16);
    const data = Buffer.concat([prefix, metaBytes]);

    const dataHash = await combineSecrets(salt, data);
    const msgKey = dataHash.subarray(0, 16);

    const cbcStateSecret = await combineSecrets(myPrivateKey, msgKey);
    const aesCbc = await getAesCbcState(cbcStateSecret);

    const encrypted = Buffer.from(aesCbc.encrypt(data));

    const encryptedMeta = Buffer.concat([msgKey, encrypted]);
    const payload = Buffer.concat([Buffer.from([0x01]), encryptedMeta]);

    return makeSnakeCells(payload);
};

export const parseSnakeCells = (cell: Cell): Uint8Array => {
    let c = cell;
    let result = new Uint8Array(0);
    while (true) {
        const cs = c.beginParse();
        if (cs.remainingBits % 8 !== 0) {
            throw new Error('Invalid cell');
        }
        const newResult = new Uint8Array(result.length + cs.remainingBits / 8);
        newResult.set(result);
        newResult.set(c.bits.subbuffer(0, c.bits.length)!, result.length);

        result = newResult;
        if (c.refs.length === 0) {
            break;
        } else if (c.refs.length === 1) {
            c = c.refs[0];
        } else {
            throw new Error('Invalid cell');
        }
    }
    return result;
};

export const decryptMeta = async (
    cell: Cell,
    sender: Address,
    privKey: Buffer
): Promise<string> => {
    if (privKey.length === 64) {
        privKey = privKey.subarray(0, 32);
    }

    const payload = Buffer.from(parseSnakeCells(cell));

    if (payload.length === 0 || payload[0] !== 0x01) {
        throw new Error('Invalid encrypted meta format');
    }

    const encryptedMeta = payload.subarray(1);

    if (encryptedMeta.length < 16 || encryptedMeta.length % 16 !== 0) {
        throw new Error('Invalid encrypted meta length');
    }

    const msgKey = encryptedMeta.subarray(0, 16);
    const encryptedData = encryptedMeta.subarray(16);

    const salt = Buffer.from(
        sender.toString({
            urlSafe: true,
            bounceable: true,
            testOnly: false
        }),
        'utf-8'
    );

    const cbcStateSecret = await combineSecrets(privKey, msgKey);
    const aesCbc = await getAesCbcState(cbcStateSecret);

    const decryptedData = Buffer.from(aesCbc.decrypt(encryptedData));

    const dataHash = await combineSecrets(salt, decryptedData);
    const expectedMsgKey = dataHash.subarray(0, 16);

    if (!msgKey.equals(expectedMsgKey)) {
        throw new Error('Wrong message key');
    }

    const prefixLength = decryptedData[0];
    if (prefixLength >= decryptedData.length) {
        throw new Error('Invalid prefix length');
    }

    const metaBytes = decryptedData.subarray(prefixLength);

    return metaBytes.toString('utf8');
};
