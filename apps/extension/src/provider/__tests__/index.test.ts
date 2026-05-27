/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The provider runs in the page (window) context. In Node we install a minimal
// fake `window` before importing the module so its constructor's
// `window.addEventListener('message', ...)` call succeeds, then drive
// `onMessage` directly with synthetic events.

type FakeWindow = {
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
    postMessage: ReturnType<typeof vi.fn>;
    location: { origin: string };
    origin: string;
};

const PAGE_ORIGIN = 'https://example.com';

let fakeWindow: FakeWindow;

const installFakeWindow = () => {
    fakeWindow = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        postMessage: vi.fn(),
        location: { origin: PAGE_ORIGIN },
        origin: PAGE_ORIGIN
    };
    (globalThis as unknown as { window: FakeWindow }).window = fakeWindow;
};

const buildEvent = (overrides: Partial<MessageEvent> = {}): MessageEvent => {
    return {
        source: fakeWindow,
        origin: PAGE_ORIGIN,
        data: undefined,
        ...overrides
    } as unknown as MessageEvent;
};

const buildApiResponse = (id: number | string, result: unknown) => ({
    type: 'TonkeeperAPI',
    message: {
        jsonrpc: '2.0',
        id,
        method: 'tonConnect_sendTransaction',
        result
    }
});

describe('TonProvider.onMessage — postMessage origin/source validation', () => {
    let TonProvider: typeof import('../index').TonProvider;

    beforeEach(async () => {
        installFakeWindow();
        vi.resetModules();
        ({ TonProvider } = await import('../index'));
    });

    afterEach(() => {
        delete (globalThis as { window?: unknown }).window;
    });

    it('drops messages whose source is not the page window (cross-frame postMessage)', async () => {
        const provider = new TonProvider();
        const pending = provider.send<unknown>('tonConnect_sendTransaction');
        const id = Object.keys(provider.promises)[0];

        const otherWindow = { not: 'page-window' };
        await provider.onMessage(
            buildEvent({
                source: otherWindow as unknown as Window,
                origin: PAGE_ORIGIN,
                data: buildApiResponse(Number(id), '<forged_data>')
            })
        );

        expect(provider.promises[id]).toBeDefined();
        const settled = await Promise.race([pending, Promise.resolve('UNSETTLED')]);
        expect(settled).toBe('UNSETTLED');
    });

    it('drops messages whose origin does not match window.location.origin', async () => {
        const provider = new TonProvider();
        const pending = provider.send<unknown>('tonConnect_sendTransaction');
        const id = Object.keys(provider.promises)[0];

        await provider.onMessage(
            buildEvent({
                source: fakeWindow as unknown as Window,
                origin: 'https://evil.example',
                data: buildApiResponse(Number(id), '<forged_data>')
            })
        );

        expect(provider.promises[id]).toBeDefined();
        const settled = await Promise.race([pending, Promise.resolve('UNSETTLED')]);
        expect(settled).toBe('UNSETTLED');
    });

    it('resolves the pending promise for a valid same-window, same-origin message', async () => {
        const provider = new TonProvider();
        const pending = provider.send<string>('tonConnect_sendTransaction');
        const id = Object.keys(provider.promises)[0];

        await provider.onMessage(
            buildEvent({
                source: fakeWindow as unknown as Window,
                origin: PAGE_ORIGIN,
                data: buildApiResponse(Number(id), 'real_result')
            })
        );

        await expect(pending).resolves.toBe('real_result');
        expect(provider.promises[id]).toBeUndefined();
    });

    it('rejects the pending promise when a valid response carries an error', async () => {
        const provider = new TonProvider();
        const pending = provider.send<unknown>('tonConnect_sendTransaction');
        const id = Object.keys(provider.promises)[0];

        await provider.onMessage(
            buildEvent({
                source: fakeWindow as unknown as Window,
                origin: PAGE_ORIGIN,
                data: {
                    type: 'TonkeeperAPI',
                    message: {
                        jsonrpc: '2.0',
                        id: Number(id),
                        method: 'tonConnect_sendTransaction',
                        error: { message: 'User rejected', code: 300 }
                    }
                }
            })
        );

        await expect(pending).rejects.toMatchObject({ message: 'User rejected', code: 300 });
    });

    it('ignores messages with no data or wrong type', async () => {
        const provider = new TonProvider();
        provider.send<unknown>('tonConnect_sendTransaction');
        const id = Object.keys(provider.promises)[0];

        await provider.onMessage(buildEvent({ data: undefined }));
        await provider.onMessage(buildEvent({ data: { type: 'OtherType', message: {} } }));
        await provider.onMessage(
            buildEvent({
                data: { type: 'TonkeeperAPI', message: { id: Number(id), result: 'x' } }
            })
        );

        expect(provider.promises[id]).toBeDefined();
    });

    it('emits tonConnect_event for valid event-shaped messages', async () => {
        const provider = new TonProvider();
        const listener = vi.fn();
        provider.on('tonConnect_event', listener);

        await provider.onMessage(
            buildEvent({
                source: fakeWindow as unknown as Window,
                origin: PAGE_ORIGIN,
                data: {
                    type: 'TonkeeperAPI',
                    message: {
                        jsonrpc: '2.0',
                        event: 'disconnect',
                        payload: {}
                    }
                }
            })
        );

        expect(listener).toHaveBeenCalledWith({
            event: 'disconnect',
            payload: {},
            id: undefined
        });
    });

    it('does NOT emit tonConnect_event when source check fails', async () => {
        const provider = new TonProvider();
        const listener = vi.fn();
        provider.on('tonConnect_event', listener);

        await provider.onMessage(
            buildEvent({
                source: { foreign: true } as unknown as Window,
                origin: PAGE_ORIGIN,
                data: {
                    type: 'TonkeeperAPI',
                    message: {
                        jsonrpc: '2.0',
                        event: 'disconnect',
                        payload: {}
                    }
                }
            })
        );

        expect(listener).not.toHaveBeenCalled();
    });
});

describe('TonProvider.send — id generation', () => {
    let TonProvider: typeof import('../index').TonProvider;

    beforeEach(async () => {
        installFakeWindow();
        vi.resetModules();
        ({ TonProvider } = await import('../index'));
    });

    afterEach(() => {
        delete (globalThis as { window?: unknown }).window;
    });

    it('does not start the id counter at a fixed predictable value (0)', () => {
        // With many fresh instances, starting id should almost never be 0.
        const starts = Array.from({ length: 30 }, () => new TonProvider().nextJsonRpcId);
        const allZero = starts.every(v => v === 0);
        expect(allZero).toBe(false);
        // Sanity: ids are within Uint32 range (crypto.getRandomValues output).
        for (const v of starts) {
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThanOrEqual(0xffffffff);
            expect(Number.isInteger(v)).toBe(true);
        }
    });

    it('issues unique, monotonically increasing ids within a single instance', () => {
        const provider = new TonProvider();
        const before = provider.nextJsonRpcId;
        provider.send<unknown>('m');
        provider.send<unknown>('m');
        provider.send<unknown>('m');
        const ids = Object.keys(provider.promises)
            .map(Number)
            .sort((a, b) => a - b);
        expect(ids).toEqual([before, before + 1, before + 2]);
    });
});
