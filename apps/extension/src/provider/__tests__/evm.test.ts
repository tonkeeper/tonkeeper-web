/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TonkeeperEvmProvider, announceEvmProvider, EvmTransport } from '../evm';

const buildTransport = (result: unknown = null) => {
    const calls: { method: string; params: unknown[] }[] = [];
    const transport: EvmTransport = {
        send: <R>(method: string, ...params: unknown[]) => {
            calls.push({ method, params });
            return Promise.resolve(result as R);
        }
    };
    return { transport, calls };
};

describe('TonkeeperEvmProvider.request — param normalization', () => {
    it('forwards an array params list unchanged', async () => {
        const { transport, calls } = buildTransport();
        await new TonkeeperEvmProvider(transport).request({
            method: 'personal_sign',
            params: ['0xdead', '0xabc']
        });
        expect(calls[0]).toEqual({ method: 'personal_sign', params: [['0xdead', '0xabc']] });
    });

    it('wraps a single object param and defaults missing params to an empty list', async () => {
        const { transport, calls } = buildTransport();
        const provider = new TonkeeperEvmProvider(transport);
        await provider.request({ method: 'eth_sendTransaction', params: { to: '0x1' } });
        await provider.request({ method: 'eth_chainId' });
        expect(calls[0].params).toEqual([[{ to: '0x1' }]]);
        expect(calls[1].params).toEqual([[]]);
    });
});

describe('TonkeeperEvmProvider — connection state mirroring', () => {
    it('captures the active address from eth_requestAccounts / eth_accounts', async () => {
        const { transport } = buildTransport(['0xAbC0000000000000000000000000000000000001']);
        const provider = new TonkeeperEvmProvider(transport);
        await provider.request({ method: 'eth_requestAccounts' });
        expect(provider.selectedAddress).toBe('0xAbC0000000000000000000000000000000000001');
    });

    it('captures chainId from eth_chainId', async () => {
        const { transport } = buildTransport('0x2105');
        const provider = new TonkeeperEvmProvider(transport);
        await provider.request({ method: 'eth_chainId' });
        expect(provider.chainId).toBe('0x2105');
    });
});

describe('TonkeeperEvmProvider — legacy affordances', () => {
    it('enable() maps to eth_requestAccounts', async () => {
        const { transport, calls } = buildTransport([]);
        await new TonkeeperEvmProvider(transport).enable();
        expect(calls[0].method).toBe('eth_requestAccounts');
    });

    it('send(method, params) and send({method, params}) both route through request', async () => {
        const { transport, calls } = buildTransport('0x1');
        const provider = new TonkeeperEvmProvider(transport);
        await provider.send('eth_chainId', []);
        await provider.send({ method: 'net_version' });
        expect(calls.map(c => c.method)).toEqual(['eth_chainId', 'net_version']);
    });

    it('sendAsync resolves the callback with a jsonrpc envelope', async () => {
        const { transport } = buildTransport('0xsig');
        const provider = new TonkeeperEvmProvider(transport);
        const response = await new Promise<Record<string, unknown>>((resolve, reject) => {
            provider.sendAsync({ id: 7, method: 'personal_sign' }, (error, res) =>
                error ? reject(error) : resolve(res as Record<string, unknown>)
            );
        });
        expect(response).toEqual({ id: 7, jsonrpc: '2.0', result: '0xsig' });
    });

    it('removeListener detaches a handler so it is not called on emit', () => {
        const { transport } = buildTransport();
        const provider = new TonkeeperEvmProvider(transport);
        const handler = vi.fn();
        provider.on('chainChanged', handler);
        provider.removeListener('chainChanged', handler);
        provider.emit('chainChanged', '0x1');
        expect(handler).not.toHaveBeenCalled();
    });
});

describe('announceEvmProvider — EIP-6963', () => {
    let events: { type: string; detail: unknown }[];
    let requestProviderListener: (() => void) | undefined;

    beforeEach(() => {
        events = [];
        requestProviderListener = undefined;
        (globalThis as unknown as { window: unknown }).window = {
            dispatchEvent: (e: { type: string; detail: unknown }) => {
                events.push({ type: e.type, detail: e.detail });
                return true;
            },
            addEventListener: (type: string, cb: () => void) => {
                if (type === 'eip6963:requestProvider') requestProviderListener = cb;
            }
        };
        (globalThis as unknown as { CustomEvent: unknown }).CustomEvent = class {
            type: string;

            detail: unknown;

            constructor(type: string, init?: { detail?: unknown }) {
                this.type = type;
                this.detail = init?.detail;
            }
        };
    });

    afterEach(() => {
        delete (globalThis as { window?: unknown }).window;
        delete (globalThis as { CustomEvent?: unknown }).CustomEvent;
    });

    it('announces once on call and again on eip6963:requestProvider, with stable Tonkeeper info', () => {
        const { transport } = buildTransport();
        const provider = new TonkeeperEvmProvider(transport);
        announceEvmProvider(provider, 'data:image/svg+xml,<svg/>');

        expect(events).toHaveLength(1);
        const detail = events[0].detail as { info: Record<string, string>; provider: unknown };
        expect(events[0].type).toBe('eip6963:announceProvider');
        expect(detail.info.name).toBe('Keeper');
        expect(detail.info.rdns).toBe('com.tonkeeper.wallet');
        expect(detail.provider).toBe(provider);

        requestProviderListener?.();
        expect(events).toHaveLength(2);
        expect((events[1].detail as { info: { uuid: string } }).info.uuid).toBe(detail.info.uuid);
    });
});
