import { defineConfig } from 'vitest/config';

// The arrival table and the handoff request it sends are plain functions over
// plain data. Nothing under test renders, so this config deliberately shares
// none of `vite.config.mts` — no wasm copy, no polyfills, no CSP.
export default defineConfig({
    // The real pair is pinned by `vite.config.mts` at build time. `arrival.ts`
    // is origin-agnostic and never reads these; `handoffRequest.ts` builds its
    // URL against the old one, so the stub is what the assertions match.
    define: {
        __MIGRATION_OLD_ORIGIN__: JSON.stringify('https://old-origin.test'),
        __MIGRATION_NEW_ORIGIN__: JSON.stringify('https://new-origin.test')
    },
    test: {
        include: ['src/**/*.test.ts'],
        environment: 'node',
        // `@tonkeeper/core` ships ESM from `tsc` without a `type` field, so Node
        // would read its `.js` as CommonJS if it were left external.
        server: {
            deps: {
                inline: [/@tonkeeper\/core/]
            }
        }
    }
});
