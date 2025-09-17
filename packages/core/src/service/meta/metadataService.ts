import * as aesjs from 'aes-js';
import { Address, beginCell, Builder, Cell } from '@ton/core';

const getRandomPrefix = (dataLength: number, minPadding: number) => {
    const prefixLength = ((minPadding + 15 + dataLength) & -16) - dataLength;
    const prefix = crypto.getRandomValues(new Uint8Array(prefixLength));
    prefix[0] = prefixLength;

    if ((prefixLength + dataLength) % 16 !== 0) throw new Error();

    return prefix;
};

const hmac_sha512 = async (key: Uint8Array, data: Uint8Array) => {
    const hmacAlgo = { name: 'HMAC', hash: 'SHA-512' } as const;
    const keyBuffer = new ArrayBuffer(key.length);
    new Uint8Array(keyBuffer).set(key);
    const dataBuffer = new ArrayBuffer(data.length);
    new Uint8Array(dataBuffer).set(data);

    const hmacKey = await crypto.subtle.importKey('raw', keyBuffer, hmacAlgo, false, ['sign']);
    const signature = await crypto.subtle.sign(hmacAlgo, hmacKey, dataBuffer);
    const result = new Uint8Array(signature);

    if (result.length !== 512 / 8) throw new Error();

    return result;
};

const combineSecrets = async (a: Uint8Array, b: Uint8Array) => {
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

export const encryptMeta = async (meta: string, sender: Address, myPrivateKey: Uint8Array) => {
    if (!meta.length) throw new Error('empty comment');

    if (myPrivateKey.length === 64) {
        myPrivateKey = myPrivateKey.slice(0, 32);
    }

    const metaBytes = new TextEncoder().encode(meta);

    const salt = new TextEncoder().encode(
        sender.toString({
            urlSafe: true,
            bounceable: true,
            testOnly: false
        })
    );

    const prefix = getRandomPrefix(metaBytes.length, 16);

    const data = new Uint8Array(prefix.length + metaBytes.length);
    data.set(prefix, 0);
    data.set(metaBytes, prefix.length);

    const dataHash = await combineSecrets(salt, data);
    const msgKey = dataHash.slice(0, 16);

    const cbcStateSecret = await combineSecrets(myPrivateKey, msgKey);
    const aesCbc = await getAesCbcState(cbcStateSecret);

    const encrypted = aesCbc.encrypt(data);

    const encryptedMeta = new Uint8Array(16 + encrypted.length);
    encryptedMeta.set(msgKey, 0);
    encryptedMeta.set(encrypted, 16);

    const payload = new Uint8Array(encryptedMeta.length + 1);
    payload[0] = 0x01;
    payload.set(encryptedMeta, 1);

    return makeSnakeCells(payload);
};

export const parseSnakeCells = (cell: Cell): Uint8Array => {
    let c = cell;
    let result = new Uint8Array(0);
    while (true) {
        const cs = c.beginParse();
        if (cs.remainingBits % 8 != 0) {
            throw new Error('Invalid cell');
        }
        const newResult = new Uint8Array(result.length + cs.remainingBits / 8);
        newResult.set(result);
        newResult.set(c.bits.subbuffer(0, c.bits.length)!, result.length);

        result = newResult;
        if (c.refs.length === 0) {
            break;
        } else if (c.refs.length == 1) {
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
    privKey: Uint8Array
): Promise<string> => {
    if (privKey.length === 64) {
        privKey = privKey.slice(0, 32);
    }

    const payload = parseSnakeCells(cell);

    if (payload.length === 0 || payload[0] !== 0x01) {
        throw new Error('Invalid encrypted meta format');
    }

    const encryptedMeta = payload.slice(1);

    if (encryptedMeta.length < 16 || encryptedMeta.length % 16 !== 0) {
        throw new Error('Invalid encrypted meta length');
    }

    const msgKey = encryptedMeta.slice(0, 16);
    const encryptedData = encryptedMeta.slice(16);

    const salt = new TextEncoder().encode(
        sender.toString({
            urlSafe: true,
            bounceable: true,
            testOnly: false
        })
    );

    const cbcStateSecret = await combineSecrets(privKey, msgKey);
    const aesCbc = await getAesCbcState(cbcStateSecret);

    const decryptedData = aesCbc.decrypt(encryptedData);

    const dataHash = await combineSecrets(salt, decryptedData);
    const expectedMsgKey = dataHash.slice(0, 16);

    for (let i = 0; i < 16; i++) {
        if (msgKey[i] !== expectedMsgKey[i]) {
            throw new Error('Wrong message key');
        }
    }

    const prefixLength = decryptedData[0];
    if (prefixLength >= decryptedData.length) {
        throw new Error('Invalid prefix length');
    }

    const metaBytes = decryptedData.slice(prefixLength);

    return new TextDecoder().decode(metaBytes);
};
