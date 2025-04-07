// Ref: https://github.com/mois-ilya/sign-data-reference/blob/main/src/utils.ts

import crypto from 'crypto';
import { Address, beginCell, Cell } from '@ton/core';
import crc32 from 'crc-32';
import {
    SignDataRequestPayloadBinary,
    SignDataRequestPayloadCell,
    SignDataRequestPayloadText
} from '../../entries/tonConnect';

/**
 * Creates hash for text or binary payload.
 * Message format:
 * message = 0xffff ++ "ton-connect/sign-data/" ++ workchain ++ address_hash ++ domain_len ++ domain ++ timestamp ++ payload
 * finalMessage = 0xffff || "ton-connect" || sha256(message)
 */
export function createTextBinaryHash(
    payload: SignDataRequestPayloadText | SignDataRequestPayloadBinary,
    parsedAddr: Address,
    domain: string,
    timestamp: number
): Buffer {
    // Create workchain buffer
    const wcBuffer = Buffer.alloc(4);
    wcBuffer.writeInt32BE(parsedAddr.workChain);

    // Create domain buffer
    const domainBuffer = Buffer.from(domain, 'utf8');
    const domainLenBuffer = Buffer.alloc(4);
    domainLenBuffer.writeUInt32BE(domainBuffer.length);

    // Create timestamp buffer
    const tsBuffer = Buffer.alloc(8);
    tsBuffer.writeBigUInt64BE(BigInt(timestamp));

    // Create payload buffer
    const typePrefix = payload.type === 'text' ? 'txt' : 'bin';
    const content = payload.type === 'text' ? payload.text : payload.bytes;
    const encoding = payload.type === 'text' ? 'utf8' : 'base64';

    const payloadPrefix = Buffer.from(typePrefix);
    const payloadBuffer = Buffer.from(content, encoding);
    const payloadLenBuffer = Buffer.alloc(4);
    payloadLenBuffer.writeUInt32BE(payloadBuffer.length);

    const message = Buffer.concat([
        Buffer.from([0xff, 0xff]),
        Buffer.from('ton-connect/sign-data/'),
        wcBuffer,
        parsedAddr.hash,
        domainLenBuffer,
        domainBuffer,
        tsBuffer,
        payloadPrefix,
        payloadLenBuffer,
        payloadBuffer
    ]);

    return crypto.createHash('sha256').update(message).digest();
}

/**
 * Creates hash for Cell payload according to TON Connect specification.
 */
export function createCellHash(
    payload: SignDataRequestPayloadCell,
    parsedAddr: Address,
    domain: string,
    timestamp: number
): Buffer {
    const cell = Cell.fromBase64(payload.cell);
    const schemaHash = crc32.buf(Buffer.from(payload.schema, 'utf8')) >>> 0; // unsigned crc32 hash

    const message = beginCell()
        .storeUint(0x75569022, 32) // prefix
        .storeUint(schemaHash, 32) // schema hash
        .storeUint(timestamp, 64) // timestamp
        .storeAddress(parsedAddr) // user wallet address
        .storeStringRefTail(domain) // app domain
        .storeRef(cell) // payload cell
        .endCell();

    return Buffer.from(message.hash());
}
