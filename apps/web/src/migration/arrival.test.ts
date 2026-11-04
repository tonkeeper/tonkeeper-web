/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
    ArrivalInput,
    isOldOriginReachable,
    resolveArrival,
    resolveMigrateLanding
} from './arrival';

const BROWSER_UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';

const visit = (input: Partial<ArrivalInput> = {}): ArrivalInput => ({
    hasAccounts: false,
    hasChecked: false,
    userAgent: BROWSER_UA,
    ...input
});

describe('deciding whether to look for wallets on the old origin', () => {
    it('asks when this profile is empty and has never asked', () => {
        expect(resolveArrival(visit())).toEqual({ kind: 'check' });
    });

    it('leaves a profile that already has wallets alone', () => {
        expect(resolveArrival(visit({ hasAccounts: true }))).toEqual({
            kind: 'skip',
            reason: 'accounts-exist'
        });
    });

    it('does not ask again once this profile has asked', () => {
        expect(resolveArrival(visit({ hasChecked: true }))).toEqual({
            kind: 'skip',
            reason: 'already-checked'
        });
    });

    // A redirect away from the canonical origin on a first visit is exactly what
    // indexing must not see.
    it.each([
        ['Googlebot', 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'],
        ['Bingbot', 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)'],
        ['a headless browser', `${BROWSER_UA} HeadlessChrome/140.0`]
    ])('never bounces %s', (_name, userAgent) => {
        expect(resolveArrival(visit({ userAgent }))).toEqual({ kind: 'skip', reason: 'crawler' });
    });
});

describe('pinging the old origin', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('counts an answer as reachable, whatever it says', async () => {
        // The response is opaque under `no-cors`, so resolving at all is the
        // whole answer — a 404 from a live origin still means it is there.
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.resolve(new Response(null, { status: 404 })))
        );

        await expect(isOldOriginReachable()).resolves.toBe(true);
    });

    it('counts a refused connection as unreachable', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
        );

        await expect(isOldOriginReachable()).resolves.toBe(false);
    });

    it('gives up on an origin that never answers', async () => {
        vi.useFakeTimers();

        // Someone opening their wallet is waiting behind this, so a slow origin
        // has to read as a down one rather than holding the boot open.
        vi.stubGlobal(
            'fetch',
            vi.fn(
                (_url: string, init: RequestInit) =>
                    new Promise((_resolve, reject) => {
                        init.signal?.addEventListener('abort', () =>
                            reject(new DOMException('Aborted', 'AbortError'))
                        );
                    })
            )
        );

        const reachable = isOldOriginReachable();

        await vi.advanceTimersByTimeAsync(2000);

        await expect(reachable).resolves.toBe(false);
    });

    it('asks the origin this build was compiled against', async () => {
        const fetchMock = vi.fn(() => Promise.resolve(new Response()));
        vi.stubGlobal('fetch', fetchMock);

        await isOldOriginReachable();

        expect(fetchMock).toHaveBeenCalledWith(
            'https://old-origin.test/',
            expect.objectContaining({ mode: 'no-cors' })
        );
    });
});

describe('landing on /migrate', () => {
    it('offers the move when the old origin found wallets', () => {
        expect(resolveMigrateLanding('found')).toEqual({
            kind: 'offer',
            found: true,
            from: 'check'
        });
    });

    it('offers the move, from the old origin, after "Move my wallets" there', () => {
        expect(resolveMigrateLanding('move&lang=1')).toEqual({
            kind: 'offer',
            found: true,
            from: 'old_domain',
            language: 1
        });
    });

    it('reads the language the old origin sent with its answer', () => {
        expect(resolveMigrateLanding('found&lang=1')).toEqual({
            kind: 'offer',
            found: true,
            from: 'check',
            language: 1
        });
    });

    it.each(['found&lang=99', 'found&lang=ru', 'found&lang=', 'found&lang=1.5'])(
        'ignores a language it does not know in %j',
        fragment => {
            expect(resolveMigrateLanding(fragment)).toEqual({
                kind: 'offer',
                found: true,
                from: 'check'
            });
        }
    );

    it('takes no language from a visit by hand', () => {
        expect(resolveMigrateLanding('none&lang=1')).toEqual({
            kind: 'offer',
            found: false,
            from: 'manual'
        });
    });

    // Wallets never arrive in a URL, so anything else in one is at most an
    // offer to open the popup.
    it.each(['', 'v1.z.abc.def.ghi', 'garbage'])('reads %j as a plain offer', fragment => {
        expect(resolveMigrateLanding(fragment)).toEqual({
            kind: 'offer',
            found: false,
            from: 'manual'
        });
    });
});
