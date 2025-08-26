import type { Configuration } from 'webpack';

import path from 'path';
import { rules } from './webpack.rules';

rules.push({
    test: /\.css$/,
    use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
});

export const rendererConfig: Configuration = {
    module: {
        rules
    },
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
            stream: require.resolve('stream-browserify'),
            crypto: require.resolve('crypto-browserify'),
            process: require.resolve('process/browser'),
            vm: false
        }
    }
};
