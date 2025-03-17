// Ref: https://github.com/mois-ilya/sign-data-reference/blob/main/src/sign.ts

import { Address } from '@ton/core';
import nacl from 'tweetnacl';
import { createTextBinaryHash, createCellHash } from './signUtils';
import { SignDataRequestPayload, SignDataResponse } from '../../entries/tonConnect';

export interface SignDataParams {
    payload: SignDataRequestPayload;
    domain: string;
    address: string;
    timestamp: number;
}
/**
 * Signs data according to TON Connect sign-data protocol.
 *
 * Supports three payload types:
 * 1. text - for text messages
 * 2. binary - for arbitrary binary data
 * 3. cell - for TON Cell with TL-B schema
 *
 * @param params Signing parameters
 * @returns Signed data with base64 signature
 */

export function signDataUint8Array(params: SignDataParams) {
    const { payload, domain, address, timestamp } = params;
    const parsedAddr = Address.parse(address);

    // Create hash based on payload type
    const finalHash =
        payload.type === 'cell'
            ? createCellHash(payload, parsedAddr, domain, timestamp)
            : createTextBinaryHash(payload, parsedAddr, domain, timestamp);

    return new Uint8Array(finalHash);
}

export function signDataResult(
    params: { signature: Uint8Array } & SignDataParams
): SignDataResponse {
    const { payload, domain, address, timestamp, signature } = params;
    return {
        signature: Buffer.from(signature).toString('base64'),
        address,
        timestamp,
        domain,
        payload
    };
}
