import type { Configuration } from 'webpack';

import path from 'path';
import webpack from 'webpack';
import NodePolyfillPlugin from 'node-polyfill-webpack-plugin';
import { rules } from './webpack.rules';

rules.push({
    test: /\.css$/,
    use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
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

export const rendererConfig: Configuration = {
    module: {
        rules
    },
    // NodePolyfillPlugin's bundled buffer is v5.7.1 (no writeBigInt64LE), so we
    // exclude its Buffer global and provide our own from buffer@6 (resolved via
    // the `buffer` alias below). Fixes WalletConnect signing on desktop.
    plugins: [
        new NodePolyfillPlugin({ excludeAliases: ['vm', 'Buffer'] }),
        new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] })
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
