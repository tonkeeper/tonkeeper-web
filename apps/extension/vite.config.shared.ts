import { resolve } from 'path';
import { UserConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const isDev = process.env.NODE_ENV === 'development';

export const sharedConfig: UserConfig = {
    envPrefix: 'REACT_APP_',
    plugins: [nodePolyfills()],
    resolve: {
        alias: {
            react: resolve(__dirname, './node_modules/react'),
            '@ton/core': resolve(__dirname, '../../packages/core/node_modules/@ton/core'),
            '@ton/crypto': resolve(__dirname, '../../packages/core/node_modules/@ton/crypto'),
            '@ton/ton': resolve(__dirname, '../../packages/core/node_modules/@ton/ton'),
            'react-dom': resolve(__dirname, './node_modules/react-dom'),
            'react-router-dom': resolve(__dirname, './node_modules/react-router-dom'),
            'styled-components': resolve(__dirname, './node_modules/styled-components'),
            'react-i18next': resolve(__dirname, './node_modules/react-i18next'),
            '@tanstack/react-query': resolve(__dirname, './node_modules/@tanstack/react-query'),
            '@ton/crypto/dist/mnemonic/mnemonic': resolve(
                __dirname,
                '../../packages/core/node_modules/@ton/crypto/dist/mnemonic/mnemonic'
            )
        }
    },
    build: {
        outDir: process.env.VITE_BUILD_DIR || 'build',
        sourcemap: isDev,
        minify: isDev ? false : 'esbuild',
        emptyOutDir: false,
        rollupOptions: {
            output: {
                assetFileNames: 'static/[name].[hash][extname]'
            }
        },
        target: 'esnext'
    }
};
