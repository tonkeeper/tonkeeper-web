import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
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
        react()
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
            '@ionic/react-router': path.resolve(__dirname, './node_modules/@ionic/react-router')
        }
    }
});
