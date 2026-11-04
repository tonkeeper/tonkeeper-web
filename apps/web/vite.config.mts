import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import { createRequire } from 'module';
import * as path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { injectCSP, metaTagCspConfig } from '@tonkeeper/core/dist/utils/csp';
import { workspaceDepsToPrebundle } from './task/workspaceDeps';

// Vite bundles this config to ESM, where `require` is undefined; recreate it.
const nodeRequire = createRequire(import.meta.url);

// CommonJS script shared with every shell's build config; see its header.
const { readAppVersion } = nodeRequire('../../scripts/app-version.js');

const walletCorePackageDir = path.dirname(
    nodeRequire.resolve('@trustwallet/wallet-core/package.json')
);
const walletCoreVersion: string = JSON.parse(
    fs.readFileSync(path.join(walletCorePackageDir, 'package.json'), 'utf8')
).version;

/**
 * Trust Wallet Core's wasm (~10 MB) is copied from the package at build time
 * and served under a path scoped by the package version, so `public/_headers`
 * can mark it immutable: upgrading wallet-core moves the URL instead of
 * invalidating a cached copy. The fetch shim in `src/wallet-core-wasm-path.ts`
 * reads the URL from the `__WALLET_CORE_WASM_URL__` define.
 */
const walletCoreWasmFile = `wallet-core/${walletCoreVersion}/wallet-core.wasm`;
const walletCoreWasmUrl = `/${walletCoreWasmFile}`;

const walletCoreWasm = (): Plugin => {
    const wasmPath = path.join(walletCorePackageDir, 'dist/lib/wallet-core.wasm');
    return {
        name: 'emit-wallet-core-wasm',
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: walletCoreWasmFile,
                source: fs.readFileSync(wasmPath)
            });
        },
        configureServer(server) {
            server.middlewares.use(walletCoreWasmUrl, (_req, res) => {
                res.setHeader('Content-Type', 'application/wasm');
                fs.createReadStream(wasmPath).pipe(res);
            });
        }
    };
};

const repoRoot = path.resolve(__dirname, '../..');

const DEFAULT_OLD_ORIGIN = 'https://wallet.tonkeeper.com';
const DEFAULT_NEW_ORIGIN = 'https://web.keeperwallet.com';

/**
 * Strip any path and trailing slash so the value is always a bare origin the
 * app can concatenate paths onto.
 */
const normalizeOrigin = (value: string, fallback: string): string => {
    try {
        return new URL(value).origin;
    } catch {
        return fallback;
    }
};

/**
 * The two origins the domain migration runs between, pinned at build time from
 * `MIGRATION_OLD_ORIGIN` / `MIGRATION_NEW_ORIGIN` so a test deploy can use any
 * host pair and nothing the browser sends can retarget a handoff.
 */
const migrationOrigins = (mode: string) => {
    const env = loadEnv(mode, repoRoot, '');

    return {
        old: normalizeOrigin(
            process.env.MIGRATION_OLD_ORIGIN || env.MIGRATION_OLD_ORIGIN || DEFAULT_OLD_ORIGIN,
            DEFAULT_OLD_ORIGIN
        ),
        new: normalizeOrigin(
            process.env.MIGRATION_NEW_ORIGIN || env.MIGRATION_NEW_ORIGIN || DEFAULT_NEW_ORIGIN,
            DEFAULT_NEW_ORIGIN
        )
    };
};

/**
 * Point the crawler-facing tags at wherever this build is actually served from,
 * so indexing settles on the new origin instead of the one being retired.
 */
const canonicalOrigin = (origin: string): Plugin => ({
    name: 'canonical-origin',
    transformIndexHtml: html =>
        html
            .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${origin}/$2`)
            .replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${origin}/$2`)
});

/**
 * Fetch the UI font alongside the entry script instead of after the first
 * render asks for it. The boot loader positions its mark against hidden text
 * that re-wraps when the font swaps in, so a late font moves the mark a line
 * up mid-animation.
 */
const preloadFonts = (): Plugin => ({
    name: 'preload-fonts',
    transformIndexHtml: {
        order: 'post',
        handler: (_html, { bundle }) =>
            Object.keys(bundle ?? {})
                .filter(file => /\/TT-Firs-Neue-[^/]+\.woff2$/.test(file))
                .map(file => ({
                    tag: 'link',
                    attrs: {
                        rel: 'preload',
                        href: `/${file}`,
                        as: 'font',
                        type: 'font/woff2',
                        crossorigin: ''
                    },
                    injectTo: 'head' as const
                }))
    }
});

// Single copy of every package that must not be duplicated across the workspace.
const alias = {
    react: path.resolve(__dirname, './node_modules/react'),
    'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
    '@ton/core': path.resolve(repoRoot, 'packages/core/node_modules/@ton/core'),
    '@ton/crypto': path.resolve(repoRoot, 'packages/core/node_modules/@ton/crypto'),
    '@ton/ton': path.resolve(repoRoot, 'packages/core/node_modules/@ton/ton'),
    'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
    'styled-components': path.resolve(__dirname, './node_modules/styled-components'),
    'react-i18next': path.resolve(__dirname, './node_modules/react-i18next'),
    '@tanstack/react-query': path.resolve(__dirname, './node_modules/@tanstack/react-query')
};

export default defineConfig(({ command, mode }) => {
    const migration = migrationOrigins(mode);

    return {
        define: {
            // Build-time env (CI) wins over the repo-root `.env` (local dev). A bare
            // global, never a `process.env.*` key: Vite's dev client turns dotted
            // keys into nested globals and would install a stub `process` ahead of
            // the node polyfill (see `wcConstants.ts`).
            __WALLETCONNECT_PROJECT_ID__: JSON.stringify(
                process.env.WALLETCONNECT_PROJECT_ID ??
                    loadEnv(mode, repoRoot, '').WALLETCONNECT_PROJECT_ID ??
                    ''
            ),
            __WALLET_CORE_WASM_URL__: JSON.stringify(walletCoreWasmUrl),
            __MIGRATION_OLD_ORIGIN__: JSON.stringify(migration.old),
            __MIGRATION_NEW_ORIGIN__: JSON.stringify(migration.new),
            __APP_VERSION__: JSON.stringify(readAppVersion(__dirname))
        },
        plugins: [
            canonicalOrigin(migration.new),
            preloadFonts(),
            walletCoreWasm(),
            nodePolyfills({
                globals: {
                    Buffer: true,
                    global: true,
                    process: true
                },
                // `util` added so deps that call `util.debuglog` / `util.inspect`
                // (e.g. via chainkit's Kotlin/JS or its transitive deps) don't
                // hit Vite's "Module 'util' externalized" warnings at runtime.
                include: ['stream', 'buffer', 'crypto', 'util']
            }),
            react(),
            injectCSP({
                ...metaTagCspConfig,
                // The old origin is pinged before a handoff round trip starts,
                // which is a cross-origin fetch. It is allowlisted for the exact
                // host this build was compiled against — production happens to
                // fall under a wildcard already in the base policy, but a demo
                // or local pair does not, and a blocked ping reads as "the old
                // origin is down" with nothing to show for it.
                'connect-src': [...new Set([...metaTagCspConfig['connect-src'], migration.old])]
            })
        ],
        server: {
            // Required for local development to test Telegram OAuth callbacks, and
            // to reach the dev server under either migration origin's host name.
            // Vite rejects requests with Host header different from localhost by default.
            allowedHosts: [
                'wallet.tonkeeper.com',
                'wallet.tonkeeper.local',
                new URL(migration.old).hostname,
                new URL(migration.new).hostname
            ],
            watch: {
                // tsc writes many files at once; wait for the burst to settle before
                // triggering a reload, otherwise the page reloads on every individual file.
                awaitWriteFinish: {
                    stabilityThreshold: 300,
                    pollInterval: 50
                }
            }
        },
        optimizeDeps: {
            // Never pre-bundle local workspace packages — they are rebuilt frequently in dev
            // and pre-bundling them causes Vite to serve a stale server-side cache that
            // survives browser hard-resets.
            exclude: ['@tonkeeper/uikit', '@tonkeeper/core', '@tonkeeper/locales'],
            // Their third-party imports still have to be pre-bundled up front: anything
            // reached only through a lazy `import()` would otherwise be discovered
            // mid-session and trigger a full reload, which re-enters the app and
            // discovers the next one — an endless reload loop.
            include:
                command === 'serve'
                    ? workspaceDepsToPrebundle(repoRoot, __dirname, Object.keys(alias))
                    : []
        },
        resolve: { alias }
    };
});
