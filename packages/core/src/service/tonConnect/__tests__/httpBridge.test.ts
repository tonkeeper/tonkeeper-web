/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IStorage } from '../../../Storage';
import type { AccountConnectionHttp } from '../connectionService';

vi.mock('../protocol', () => ({
    SessionCrypto: class {
        sessionId = 'session-1';
    }
}));

import { subscribeTonConnect } from '../httpBridge';

class FakeEventSource {
    static instances: FakeEventSource[] = [];

    listeners: Record<string, ((event: unknown) => void)[]> = {};

    constructor(public url: string) {
        FakeEventSource.instances.push(this);
    }

    addEventListener(type: string, listener: (event: unknown) => void) {
        (this.listeners[type] ??= []).push(listener);
    }

    removeEventListener = vi.fn();

    close = vi.fn();

    emit(type: string, event: unknown) {
        this.listeners[type]?.forEach(listener => listener(event));
    }
}

const createStorage = (): IStorage => {
    const data = new Map<string, unknown>();
    return {
        get: async (key: string) => (data.get(key) as never) ?? null,
        set: async (key: string, value: unknown) => {
            data.set(key, value);
            return value as never;
        },
        delete: async (key: string) => {
            data.delete(key);
            return null;
        },
        clear: async () => data.clear()
    } as unknown as IStorage;
};

const connections = [
    { clientSessionId: 'client-1', sessionKeyPair: {} } as unknown as AccountConnectionHttp
];

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

const subscribe = (storage: IStorage) =>
    subscribeTonConnect({
        storage,
        handleMessage: () => {},
        connections,
        bridgeEndpoint: 'https://bridge.example'
    });

describe('subscribeTonConnect last event id', () => {
    beforeEach(() => {
        FakeEventSource.instances = [];
        vi.stubGlobal('EventSource', FakeEventSource);
        vi.spyOn(console, 'debug').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    it('resubscribes with the id of the last delivered event', async () => {
        const storage = createStorage();

        subscribe(storage);
        await flush();
        FakeEventSource.instances[0].emit('message', { lastEventId: 'E1', data: 'not-json' });
        await Promise.resolve();

        subscribe(storage);
        await flush();

        expect(FakeEventSource.instances[0].url).not.toContain('last_event_id');
        expect(FakeEventSource.instances[1].url).toContain('last_event_id=E1');
    });

    it('moves the id forward on every event', async () => {
        const storage = createStorage();

        subscribe(storage);
        await flush();
        FakeEventSource.instances[0].emit('message', { lastEventId: 'E1', data: 'not-json' });
        FakeEventSource.instances[0].emit('message', { lastEventId: 'E2', data: 'not-json' });
        await Promise.resolve();

        subscribe(storage);
        await flush();

        expect(FakeEventSource.instances[1].url).toContain('last_event_id=E2');
    });
});
