import type { Configuration } from 'webpack';

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import webpack from 'webpack';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import { rules } from './webpack.rules';
import { readAppVersion } from '../../scripts/app-version';

/**
 * Rewrite the renderer HTML's Content-Security-Policy meta from the single
 * source of truth (`csp.mts` `metaTagCspConfig`), so the desktop connect-src
 * tracks chain-kit's node providers + the WalletConnect relay instead of a
 * hand-maintained copy that silently drifts. Best-effort: any failure leaves
 * the static CSP already in `index.html` (which carries `wasm-unsafe-eval`),
 * so this can never break the build.
 */
class InjectCspPlugin {
    apply(compiler: webpack.Compiler) {
        compiler.hooks.thisCompilation.tap('InjectCsp', compilation => {
            compilation.hooks.processAssets.tapPromise(
                {
                    name: 'InjectCsp',
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_REPORT
                },
                async () => {
                    try {
                        const cspModule = pathToFileURL(
                            require.resolve('@tonkeeper/core/dist/utils/csp.mjs')
                        ).href;
                        const { metaTagCspConfig, cspConfigContentToString } = await import(
                            cspModule
                        );
                        const content = cspConfigContentToString(metaTagCspConfig);
                        for (const name of Object.keys(compilation.assets)) {
                            if (!name.endsWith('.html')) continue;
                            const html = compilation.assets[name].source().toString();
                            const replaced = html.replace(
                                /<meta http-equiv="Content-Security-Policy"[\s\S]*?>/,
                                `<meta http-equiv="Content-Security-Policy" content="${content}">`
                            );
                            if (replaced !== html) {
                                compilation.updateAsset(
                                    name,
                                    new webpack.sources.RawSource(replaced)
                                );
                            }
                        }
                    } catch (e) {
                        console.warn('InjectCsp: keeping static CSP —', (e as Error).message);
                    }
                }
            );
        });
    }
}

/**
 * Emit chain-kit's Trust Wallet Core wasm (~10 MB) next to the renderer's
 * index.html so the shim in `src/wallet-core-wasm-path.ts` can serve it
 * relative to `location.href`. Copied from the package at build time rather
 * than committed.
 *
 * The entrypoint's html lands in `main_window/`, so the wasm must be emitted
 * under the same prefix — an asset emitted at the output root resolves one
 * level above `location.href` and 404s in the packaged `file://` build.
 */
class EmitWalletCoreWasmPlugin {
    apply(compiler: webpack.Compiler) {
        compiler.hooks.thisCompilation.tap('EmitWalletCoreWasm', compilation => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'EmitWalletCoreWasm',
                    stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
                },
                () => {
                    const pkgJson = require.resolve('@trustwallet/wallet-core/package.json');
                    const wasm = path.join(path.dirname(pkgJson), 'dist/lib/wallet-core.wasm');
                    compilation.emitAsset(
                        'main_window/wallet-core.wasm',
                        new webpack.sources.RawSource(fs.readFileSync(wasm))
                    );
                }
            );
        });
    }
}

// postcss-loader auto-searches for a config starting from the processed
// file's directory — uikit's dist/styles/tailwind.css lives outside this
// app, so the search would never reach apps/desktop/postcss.config.cjs and
// Tailwind directives would ship to the bundle unexpanded. Pin the config.
rules.push({
    test: /\.css$/,
    use: [
        { loader: 'style-loader' },
        { loader: 'css-loader' },
        {
            loader: 'postcss-loader',
            options: {
                postcssOptions: {
                    config: path.resolve(__dirname, 'postcss.config.cjs')
                }
            }
        }
    ]
});

// webpack 5 strict-ESM mode requires fully-specified paths for .mjs imports;
// node-stdlib-browser polyfills (used by node-polyfill-webpack-plugin) resolve
// to directory paths that break this. Disable fullySpecified for all JS/MJS.
rules.push({
    test: /\.m?js$/,
    resolve: {
        fullySpecified: false
    }
});

/**
 * Build-time env for values compiled into the renderer bundle: the shell
 * environment (CI) wins over the repo-root `.env` file (local dev, see
 * `.env.example`).
 */
const buildEnv = (key: string): string => {
    if (process.env[key]) {
        return process.env[key]!;
    }
    try {
        const env = fs.readFileSync(path.resolve(__dirname, '../../.env'), 'utf8');
        const match = env.match(new RegExp(`^${key}=(.*)$`, 'm'));
        return match ? match[1].trim() : '';
    } catch (e) {
        return '';
    }
};

export const rendererConfig: Configuration = {
    module: {
        rules
    },
    // NodePolyfillPlugin's bundled buffer is v5.7.1 (no writeBigInt64LE), so we
    // exclude its Buffer global and provide our own from buffer@6 (resolved via
    // the `buffer` alias below). Fixes WalletConnect signing on desktop.
    plugins: [
        new NodePolyfillPlugin({ excludeAliases: ['vm', 'Buffer'] }),
        new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
        new webpack.DefinePlugin({
            __WALLETCONNECT_PROJECT_ID__: JSON.stringify(buildEnv('WALLETCONNECT_PROJECT_ID')),
            __APP_VERSION__: JSON.stringify(readAppVersion(__dirname))
        }),
        new EmitWalletCoreWasmPlugin(),
        new InjectCspPlugin()
    ],
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
        alias: {
            buffer: path.resolve(__dirname, './node_modules/buffer'),
            react: path.resolve(__dirname, './node_modules/react'),
            'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
            'react-router-dom': path.resolve(__dirname, './node_modules/react-router-dom'),
            'styled-components': path.resolve(__dirname, './node_modules/styled-components'),
            'react-i18next': path.resolve(__dirname, './node_modules/react-i18next'),
            '@tanstack/react-query': path.resolve(
                __dirname,
                './node_modules/@tanstack/react-query'
            ),
            '@ton/core': path.resolve(__dirname, '../../packages/core/node_modules/@ton/core'),
            '@ton/crypto': path.resolve(__dirname, '../../packages/core/node_modules/@ton/crypto'),
            '@ton/crypto/dist/mnemonic/mnemonic': path.resolve(
                __dirname,
                '../../packages/core/node_modules/@ton/crypto/dist/mnemonic/mnemonic'
            ),
            '@ton/ton': path.resolve(__dirname, '../../packages/core/node_modules/@ton/ton')
        },
        fallback: {
            vm: false
        }
    }
};
