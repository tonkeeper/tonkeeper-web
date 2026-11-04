import { defineConfig, loadEnv, Plugin } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { injectCSP, metaTagCspConfig } from '@tonkeeper/core/dist/utils/csp';

// Vite bundles this config to ESM, where `require` is undefined; recreate it.
const nodeRequire = createRequire(import.meta.url);

// CommonJS script shared with every shell's build config; see its header.
const { readAppVersion } = nodeRequire('../../scripts/app-version.js');

/**
 * Emit chain-kit's Trust Wallet Core wasm (~10 MB) to the bundle root so the
 * fetch shim in `src/wallet-core-wasm-path.ts` can serve it from the site
 * root. Copied from the package at build time rather than committed; also
 * served in dev for anyone running `vite` directly.
 */
const walletCoreWasm = (): Plugin => {
    const wasmPath = () =>
        path.join(
            path.dirname(nodeRequire.resolve('@trustwallet/wallet-core/package.json')),
            'dist/lib/wallet-core.wasm'
        );
    return {
        name: 'emit-wallet-core-wasm',
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'wallet-core.wasm',
                source: fs.readFileSync(wasmPath())
            });
        },
        configureServer(server) {
            server.middlewares.use('/wallet-core.wasm', (_req, res) => {
                res.setHeader('Content-Type', 'application/wasm');
                fs.createReadStream(wasmPath()).pipe(res);
            });
        }
    };
};

export default defineConfig(({ mode }) => ({
    define: {
        // Build-time env (CI) wins over the repo-root `.env` (local dev). A bare
        // global, never a `process.env.*` key: Vite's dev client turns dotted
        // keys into nested globals and would install a stub `process` ahead of
        // the node polyfill (see `wcConstants.ts`).
        __WALLETCONNECT_PROJECT_ID__: JSON.stringify(
            process.env.WALLETCONNECT_PROJECT_ID ??
                loadEnv(mode, path.resolve(__dirname, '../..'), '').WALLETCONNECT_PROJECT_ID ??
                ''
        ),
        __APP_VERSION__: JSON.stringify(readAppVersion(__dirname))
    },
    build: {
        outDir: './dist',
        minify: false,
        emptyOutDir: true
    },
    plugins: [
        nodePolyfills({
            globals: {
                Buffer: true,
                global: true,
                process: true
            },
            include: ['stream', 'buffer', 'crypto']
        }),
        react(),
        injectCSP(metaTagCspConfig),
        walletCoreWasm()
    ],
    resolve: {
        alias: {
            react: path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
            '@ton/core': path.resolve(__dirname, '../../packages/core/node_modules/@ton/core'),
            '@ton/crypto': path.resolve(__dirname, '../../packages/core/node_modules/@ton/crypto'),
            '@ton/ton': path.resolve(__dirname, '../../packages/core/node_modules/@ton/ton'),
            'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
            'styled-components': path.resolve(__dirname, './node_modules/styled-components'),
            'react-i18next': path.resolve(__dirname, './node_modules/react-i18next'),
            '@tanstack/react-query': path.resolve(
                __dirname,
                './node_modules/@tanstack/react-query'
            ),
            '@ionic/react': path.resolve(__dirname, './node_modules/@ionic/react'),
            '@ionic/react-router': path.resolve(__dirname, './node_modules/@ionic/react-router'),
            zod: path.resolve(__dirname, '../../packages/core/node_modules/zod')
        }
    }
}));
