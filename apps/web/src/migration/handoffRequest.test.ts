/* eslint-disable import/no-extraneous-dependencies */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    createHandoffRequest,
    settleCheckAnswer,
    startOldOriginCheck,
    takeResumePath
} from './handoffRequest';

const stubSessionStorage = () => {
    const entries = new Map<string, string>();

    vi.stubGlobal('sessionStorage', {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => entries.set(key, value),
        removeItem: (key: string) => entries.delete(key)
    });

    return entries;
};

describe('a handoff request', () => {
    it('posts a 16-byte nonce and an uncompressed P-256 point', async () => {
        const { request } = await createHandoffRequest();

        expect(request.nonce).toMatch(/^[A-Za-z0-9_-]{22}$/);
        expect(request.publicKey).toMatch(/^[A-Za-z0-9_-]{87}$/);
    });

    it('keeps a private key that can not be read back out', async () => {
        const { pending } = await createHandoffRequest();

        expect(pending.privateKey.extractable).toBe(false);
        await expect(crypto.subtle.exportKey('jwk', pending.privateKey)).rejects.toThrow();
    });

    it('never reuses a nonce or a key', async () => {
        const first = await createHandoffRequest();
        const second = await createHandoffRequest();

        expect(first.request.nonce).not.toBe(second.request.nonce);
        expect(first.request.publicKey).not.toBe(second.request.publicKey);
    });
});

describe('the check', () => {
    let stored: Map<string, string>;

    beforeEach(() => {
        vi.unstubAllGlobals();
        stored = stubSessionStorage();
    });

    it('asks the old origin this build was compiled against, and nothing else', () => {
        expect(startOldOriginCheck('/')).toBe('https://old-origin.test/#check');
    });

    it('keeps the resume path out of the URL', () => {
        const url = startOldOriginCheck('/ton-connect?v=2&id=abc');

        expect(url).not.toContain('ton-connect');
        expect(takeResumePath()).toBe('/ton-connect?v=2&id=abc');
    });

    it('hands the resume path back once', () => {
        startOldOriginCheck('/somewhere');
        takeResumePath();

        expect(takeResumePath()).toBeUndefined();
        expect(stored.size).toBe(0);
    });

    it('fails the check rather than lose where the person was going', () => {
        vi.stubGlobal('sessionStorage', {
            setItem: () => {
                throw new DOMException('The operation is insecure.', 'SecurityError');
            }
        });

        expect(() => startOldOriginCheck('/')).toThrow();
    });

    it('reads a browser that blocks site data as no resume path', () => {
        vi.stubGlobal('sessionStorage', {
            getItem: () => {
                throw new DOMException('The operation is insecure.', 'SecurityError');
            }
        });

        expect(takeResumePath()).toBeUndefined();
    });
});

describe('settling the "nothing here" answer', () => {
    const at = (pathname: string, hash: string) => ({
        pathname,
        hash,
        origin: 'https://new-origin.test'
    });

    beforeEach(() => {
        vi.unstubAllGlobals();
        stubSessionStorage();
    });

    it('turns it into the page the visit was for', () => {
        startOldOriginCheck('/ton-connect?v=2&id=abc');

        expect(settleCheckAnswer(at('/migrate', '#none'))).toBe('/ton-connect?v=2&id=abc');
    });

    it('falls back to the root with no resume path kept', () => {
        expect(settleCheckAnswer(at('/migrate', '#none'))).toBe('/');
    });

    // `//host` parses as another host, which would carry the visit off-origin.
    it('never settles on another origin', () => {
        startOldOriginCheck('//attacker.test/phish');

        expect(settleCheckAnswer(at('/migrate', '#none'))).toBe('/');
    });

    it('rejects a same-origin pathname that would navigate to another host', () => {
        const origin = 'https://new-origin.test';
        const pathname = new URL(`${origin}//new-origin.test//attacker.test/phish`).pathname;

        expect(new URL(pathname, origin).origin).toBe(origin);
        startOldOriginCheck(pathname);

        expect(settleCheckAnswer(at('/migrate', '#none'))).toBe('/');
    });

    it.each([
        ['/migrate', '#found'],
        ['/migrate', ''],
        ['/', '#none']
    ])('leaves %s%s to the app', (pathname, hash) => {
        expect(settleCheckAnswer(at(pathname, hash))).toBeUndefined();
    });
});
