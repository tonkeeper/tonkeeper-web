/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { readRequest } from './channel';

const NEW_ORIGIN = 'https://new-origin.test';
const opener = { name: 'the window that opened this one' };

const request = {
    protocol: 'tk-migration-v1',
    type: 'request',
    nonce: 'AAECAwQFBgcICQoLDA0ODw',
    publicKey: `BA${'a'.repeat(85)}`
};

const from = (overrides: Partial<{ origin: string; source: unknown; data: unknown }> = {}) => ({
    origin: NEW_ORIGIN,
    source: opener,
    data: request,
    ...overrides
});

const read = (event: ReturnType<typeof from>, expectedOpener: unknown = opener) =>
    readRequest(event, { opener: expectedOpener, newOrigin: NEW_ORIGIN });

describe('a request from the opener', () => {
    it('is read when the browser says it came from the opener on the new origin', () => {
        expect(read(from())).toEqual({ nonce: request.nonce, publicKey: request.publicKey });
    });

    it('is ignored from any other origin', () => {
        expect(read(from({ origin: 'https://attacker.test' }))).toBeUndefined();
        expect(read(from({ origin: 'https://new-origin.test.attacker.test' }))).toBeUndefined();
    });

    // The right origin in some other tab or frame is still not the window
    // waiting for these wallets.
    it('is ignored from any window but the opener', () => {
        expect(read(from({ source: { name: 'another tab' } }))).toBeUndefined();
    });

    it('is ignored when nothing opened this window', () => {
        expect(read(from({ source: null }), null)).toBeUndefined();
    });

    it.each([
        ['another protocol', { ...request, protocol: 'something-else' }],
        ['another message type', { ...request, type: 'payload' }],
        ['a malformed nonce', { ...request, nonce: 'short' }],
        ['a malformed key', { ...request, publicKey: 'key' }],
        ['no data at all', null]
    ])('is ignored with %s', (_, data) => {
        expect(read(from({ data }))).toBeUndefined();
    });
});
