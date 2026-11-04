/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { decodeBroadcastMessage } from '../index';

describe('decodeBroadcastMessage', () => {
    it('decodes the hex-encoded TronGrid message', () => {
        const text =
            'Contract validate error : Validate TransferContract error, balance is not sufficient.';
        expect(decodeBroadcastMessage(Buffer.from(text, 'utf8').toString('hex'))).toBe(text);
    });

    it('keeps a plain-text message as is', () => {
        expect(decodeBroadcastMessage('balance is not sufficient')).toBe(
            'balance is not sufficient'
        );
    });

    it('returns undefined without a message', () => {
        expect(decodeBroadcastMessage(undefined)).toBeUndefined();
        expect(decodeBroadcastMessage('')).toBeUndefined();
    });
});
