/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

// Smoke test: the root `@tonkeeper/chainkit` package resolves from `packages/core`
// and `await ready()` completes under vitest's Node environment. Browser shells
// additionally need the `wallet-core.wasm` fetch shim (`chains/walletCoreWasm.ts`).
describe('chainkit resolves from @tonkeeper/core', () => {
    it('imports the package and ready() resolves', async () => {
        const chainkit = await import('@tonkeeper/chainkit');
        expect(typeof chainkit.ready).toBe('function');
        await expect(chainkit.ready()).resolves.toBeUndefined();
    });
});
