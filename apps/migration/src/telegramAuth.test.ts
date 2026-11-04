/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it, vi } from 'vitest';

import { deliverTgAuthResult, readTgAuthResult, TgAuthWindow } from './telegramAuth';

const NEW_ORIGIN = 'https://web.keeperwallet.com';

const authData = { id: 42, first_name: 'Ölga', hash: 'abc' };
const base64 = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(authData))));
const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const popup = (overrides: Partial<TgAuthWindow> = {}) => ({
    opener: { postMessage: vi.fn() },
    close: vi.fn(),
    ...overrides
});

describe('reading the result', () => {
    it('restores standard base64 from the url-safe fragment', () => {
        expect(readTgAuthResult(`#tgAuthResult=${base64url}`)).toBe(base64);
    });

    it('ignores any other fragment', () => {
        expect(readTgAuthResult('')).toBeUndefined();
        expect(readTgAuthResult('#check')).toBeUndefined();
    });
});

describe('delivering the result', () => {
    it('hands it to the mobile bridge when one is injected', () => {
        const sendResult = vi.fn();
        const postMessage = vi.fn();
        const target = popup({ opener: { postMessage }, tonkeeper: { tgAuth: { sendResult } } });

        expect(deliverTgAuthResult(base64, target, NEW_ORIGIN)).toBe(true);
        expect(sendResult).toHaveBeenCalledWith(base64);
        expect(postMessage).not.toHaveBeenCalled();
    });

    it('posts it only to the new origin and closes the popup', () => {
        const postMessage = vi.fn();
        const target = popup({ opener: { postMessage } });

        expect(deliverTgAuthResult(base64, target, NEW_ORIGIN)).toBe(true);
        expect(postMessage).toHaveBeenCalledWith(
            JSON.stringify({ event: 'auth_result', result: authData }),
            NEW_ORIGIN
        );
        expect(target.close).toHaveBeenCalled();
    });

    it('reports nobody to hand it to', () => {
        expect(deliverTgAuthResult(base64, popup({ opener: null }), NEW_ORIGIN)).toBe(false);
    });

    it('refuses a result that is not auth data', () => {
        const target = popup();

        expect(deliverTgAuthResult('bm90IGpzb24=', target, NEW_ORIGIN)).toBe(false);
        expect(target.close).not.toHaveBeenCalled();
    });
});
