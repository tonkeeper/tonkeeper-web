/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import { sealHandoff } from '../../../migration/src/handoff';
import {
    HandoffOutcome,
    IncomingMessage,
    PopupEnvironment,
    PopupWindow,
    startHandoffPopup
} from './handoffChannel';

const OLD_ORIGIN = 'https://old-origin.test';
const NEW_ORIGIN = 'https://new-origin.test';
const PROTOCOL = 'tk-migration-v1';

const ENTRIES = { accounts: [{ id: 'a', type: 'watch-only' }] };

interface Posted {
    message: { type: string; nonce: string; publicKey: string };
    targetOrigin: string;
}

/**
 * A browser with one popup in it: what this tab posts to the popup is
 * recorded, and `deliver` plays a message into this tab as if the browser had
 * stamped it with that origin and source.
 */
const fakeBrowser = (options: { blocked?: boolean } = {}) => {
    const posted: Posted[] = [];
    const listeners = new Set<(event: IncomingMessage) => void>();
    const ticks = new Set<() => void>();

    const popup: PopupWindow & { closed: boolean } = {
        closed: false,
        postMessage: (message, targetOrigin) =>
            posted.push({ message: message as Posted['message'], targetOrigin }),
        close: () => {
            popup.closed = true;
        }
    };

    const env: PopupEnvironment = {
        open: url => {
            expect(url).toBe(`${OLD_ORIGIN}/handoff`);
            return options.blocked ? null : popup;
        },
        listen: handler => {
            listeners.add(handler);
            return () => listeners.delete(handler);
        },
        every: (_, tick) => {
            ticks.add(tick);
            return () => ticks.delete(tick);
        }
    };

    const deliver = (data: unknown, from: { origin?: string; source?: unknown } = {}) =>
        listeners.forEach(listener =>
            listener({ origin: from.origin ?? OLD_ORIGIN, source: from.source ?? popup, data })
        );

    const tick = () => ticks.forEach(run => run());

    /** Waits for the request this tab posts once the popup says it's ready. */
    const requestPosted = async (): Promise<Posted> => {
        deliver({ protocol: PROTOCOL, type: 'ready' });

        for (let i = 0; i < 50 && posted.length === 0; i++) {
            await new Promise(resolve => setTimeout(resolve, 5));
        }

        return posted[posted.length - 1];
    };

    return { env, popup, posted, deliver, tick, requestPosted, listeners };
};

const sealFor = (posted: Posted, entries: Record<string, unknown> = ENTRIES) =>
    sealHandoff({
        request: { nonce: posted.message.nonce, publicKey: posted.message.publicKey },
        entries,
        from: OLD_ORIGIN,
        to: NEW_ORIGIN
    });

const settled = async (outcome: Promise<HandoffOutcome>): Promise<HandoffOutcome | 'pending'> =>
    Promise.race([
        outcome,
        new Promise<'pending'>(resolve => setTimeout(() => resolve('pending'), 30))
    ]);

describe('the popup exchange', () => {
    it('posts its request to the old origin only, and takes the wallets it sealed', async () => {
        const browser = fakeBrowser();
        const { outcome } = startHandoffPopup(browser.env);

        const posted = await browser.requestPosted();

        expect(posted.targetOrigin).toBe(OLD_ORIGIN);
        expect(posted.message).toMatchObject({ protocol: PROTOCOL, type: 'request' });

        browser.deliver({ protocol: PROTOCOL, type: 'payload', payload: await sealFor(posted) });

        await expect(outcome).resolves.toEqual({ kind: 'payload', entries: ENTRIES });
        expect(browser.listeners.size).toBe(0);
    });

    // The whole point of the channel: the browser, not the sender, says where
    // a message came from.
    it('ignores a payload from any other origin, even one sealed to this request', async () => {
        const browser = fakeBrowser();
        const { outcome } = startHandoffPopup(browser.env);
        const payload = await sealFor(await browser.requestPosted());

        browser.deliver(
            { protocol: PROTOCOL, type: 'payload', payload },
            { origin: 'https://attacker.test' }
        );

        await expect(settled(outcome)).resolves.toBe('pending');
    });

    it('ignores a payload from any window but the popup it opened', async () => {
        const browser = fakeBrowser();
        const { outcome } = startHandoffPopup(browser.env);
        const payload = await sealFor(await browser.requestPosted());

        browser.deliver(
            { protocol: PROTOCOL, type: 'payload', payload },
            { source: { name: 'another tab on the old origin' } }
        );

        await expect(settled(outcome)).resolves.toBe('pending');
    });

    it('ignores messages of any other protocol', async () => {
        const browser = fakeBrowser();
        const { outcome } = startHandoffPopup(browser.env);

        browser.deliver({ type: 'none' });
        browser.deliver({ protocol: 'other', type: 'none' });

        await expect(settled(outcome)).resolves.toBe('pending');
    });

    it('answers a popup that reloads with the same request', async () => {
        const browser = fakeBrowser();
        startHandoffPopup(browser.env);

        const first = await browser.requestPosted();
        const second = await browser.requestPosted();

        expect(second.message).toEqual(first.message);
    });

    it('is spent on its first payload', async () => {
        const browser = fakeBrowser();
        const { outcome } = startHandoffPopup(browser.env);
        const posted = await browser.requestPosted();

        browser.deliver({ protocol: PROTOCOL, type: 'payload', payload: 'v1.z.garbage' });
        browser.deliver({ protocol: PROTOCOL, type: 'payload', payload: await sealFor(posted) });

        await expect(outcome).resolves.toEqual({ kind: 'rejected', reason: 'malformed' });
    });

    it.each(['none', 'declined'] as const)('reports the popup answering %s', async type => {
        const browser = fakeBrowser();
        const { outcome } = startHandoffPopup(browser.env);

        browser.deliver({ protocol: PROTOCOL, type });

        await expect(outcome).resolves.toEqual({ kind: type });
    });

    it('reports a popup closed before it answered', async () => {
        const browser = fakeBrowser();
        const { outcome } = startHandoffPopup(browser.env);

        browser.popup.close();
        browser.tick();

        await expect(outcome).resolves.toEqual({ kind: 'closed' });
    });

    it('closes the popup when cancelled from here', async () => {
        const browser = fakeBrowser();
        const session = startHandoffPopup(browser.env);

        session.cancel();

        expect(browser.popup.closed).toBe(true);
        await expect(session.outcome).resolves.toEqual({ kind: 'closed' });
    });

    it('reports a popup the browser blocked', async () => {
        const browser = fakeBrowser({ blocked: true });

        await expect(startHandoffPopup(browser.env).outcome).resolves.toEqual({ kind: 'blocked' });
        expect(browser.listeners.size).toBe(0);
    });
});
