/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';
import { Address } from '@ton/core';
import { sendRequestPayloadSchema, transactionRequestPayloadSchema } from '../tonConnect';

const rawAddress = `0:${'ab'.repeat(32)}`;
const address = Address.parse(rawAddress);

const transaction = (from: string) => ({ valid_until: 1, messages: [], from });
const signText = (from: string) => ({ type: 'text', text: 'hi', from });

describe('TonConnect request "from"', () => {
    it.each([
        ['raw', rawAddress],
        ['raw masterchain', `-1:${'AB'.repeat(32)}`],
        ['bounceable', address.toString({ urlSafe: true, bounceable: true })],
        ['non-bounceable', address.toString({ urlSafe: true, bounceable: false })],
        ['testnet', address.toString({ urlSafe: true, testOnly: true })],
        ['base64 (not url-safe)', address.toString({ urlSafe: false, bounceable: true })]
    ])('accepts a %s address', (_, from) => {
        expect(transactionRequestPayloadSchema.safeParse(transaction(from)).success).toBe(true);
        expect(sendRequestPayloadSchema.safeParse(signText(from)).success).toBe(true);
    });

    it.each([
        ['empty', ''],
        ['short raw', '0:abc'],
        ['unknown workchain', `1:${'ab'.repeat(32)}`],
        ['short friendly', 'EQabc'],
        ['dns name', 'wallet.ton']
    ])('rejects a %s value', (_, from) => {
        expect(transactionRequestPayloadSchema.safeParse(transaction(from)).success).toBe(false);
        expect(sendRequestPayloadSchema.safeParse(signText(from)).success).toBe(false);
    });
});
