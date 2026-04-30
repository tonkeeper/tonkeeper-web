import type { Configuration } from 'webpack';

import path from 'path';
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
    plugins: [new NodePolyfillPlugin({ excludeAliases: ['vm'] })],
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
        alias: {
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
