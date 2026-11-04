/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installWalletCoreWasmShim } from '../walletCoreWasm';

const INSTALLED = Symbol.for('tonkeeper.walletCoreWasmShim');
const PAGE = 'file:///app/renderer/main_window/index.html';
const TARGET = 'file:///app/renderer/main_window/wallet-core.wasm';

class FakeXhr {
    static opened: unknown[][] = [];

    open(...args: unknown[]) {
        FakeXhr.opened.push(args);
    }
}

describe('installWalletCoreWasmShim', () => {
    let fetchMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        delete (globalThis as Record<symbol, unknown>)[INSTALLED];
        FakeXhr.opened = [];
        fetchMock = vi.fn(() => Promise.resolve(new Response()));
        vi.stubGlobal('fetch', fetchMock);
        vi.stubGlobal('XMLHttpRequest', FakeXhr);
        vi.stubGlobal('location', { href: PAGE, origin: 'null' });
        installWalletCoreWasmShim(() => new URL('wallet-core.wasm', PAGE).href);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('redirects a fetch of the wasm to the target', async () => {
        await fetch('file:///app/renderer/948/wallet-core.wasm');
        expect(fetchMock).toHaveBeenCalledWith(TARGET, undefined);
    });

    it('redirects an XMLHttpRequest of the wasm to the target', () => {
        new XMLHttpRequest().open('GET', 'file:///app/renderer/948/wallet-core.wasm', true);
        expect(FakeXhr.opened).toEqual([['GET', TARGET, true]]);
    });

    it('leaves other requests untouched', async () => {
        await fetch('https://example.com/data.json');
        new XMLHttpRequest().open('GET', 'https://example.com/data.json', true);
        expect(fetchMock).toHaveBeenCalledWith('https://example.com/data.json', undefined);
        expect(FakeXhr.opened).toEqual([['GET', 'https://example.com/data.json', true]]);
    });
});
