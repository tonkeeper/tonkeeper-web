import { defineConfig } from 'vitest/config';

// `@ton-keychain/core` imports `@ton/crypto/dist/mnemonic/mnemonic` without the
// `.js` extension. Node ESM doesn't auto-resolve extensions, so vitest can't
// load it. The bundlers used by the apps (Vite, webpack) tolerate this; vitest
// needs an explicit alias.
export default defineConfig({
    test: {
        include: ['src/**/*.test.ts'],
        environment: 'node',
        server: {
            deps: {
                // Force @ton-keychain/core through the Vite transform pipeline so
                // the alias below applies to its imports. Without inlining, vitest
                // hands the package to Node's native ESM loader, which can't
                // resolve the extension-less submodule path.
                inline: [/@ton-keychain\/core/]
            }
        }
    },
    resolve: {
        alias: {
            '@ton/crypto/dist/mnemonic/mnemonic': '@ton/crypto/dist/mnemonic/mnemonic.js'
        }
    }
});
