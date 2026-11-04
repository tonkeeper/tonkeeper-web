import { defineConfig } from 'vitest/config';

// The routing table and the storage probe are plain functions over plain data —
// no DOM, no wallet code, nothing this app renders. Everything that does touch
// the browser stays in the screens.
export default defineConfig({
    // The real destination is pinned by `vite.config.mts` at build time. Nothing
    // under test reads it — every function takes the origin it works against as
    // an argument — so a stub keeps the tests honest about that.
    define: {
        __MIGRATION_NEW_ORIGIN__: JSON.stringify('https://new-origin.test')
    },
    test: {
        include: ['src/**/*.test.ts'],
        environment: 'node'
    }
});
