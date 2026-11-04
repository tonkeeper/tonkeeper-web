import type { Configuration } from 'webpack';
import webpack from 'webpack';

import { rules } from './webpack.rules';
import path from 'path';
import { readAppVersion } from '../../scripts/app-version';

export const mainConfig: Configuration = {
    /**
     * This is the main entry point for your application, it's the first file
     * that runs in the main process.
     */
    entry: './src/index.ts',
    // Put your normal webpack config below here
    module: {
        rules
    },
    plugins: [
        new webpack.DefinePlugin({
            __APP_VERSION__: JSON.stringify(readAppVersion(__dirname))
        })
    ],
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
        alias: {
            '@ton/crypto/dist/mnemonic/mnemonic': path.resolve(
                __dirname,
                '../../packages/core/node_modules/@ton/crypto/dist/mnemonic/mnemonic'
            )
        }
    }
};
