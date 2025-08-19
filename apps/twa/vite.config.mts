import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { injectCSP, metaTagCspConfig } from "@tonkeeper/core/dist/utils/csp.mjs";



export default defineConfig({
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
      injectCSP(metaTagCspConfig)
    ],
    server: {
      allowedHosts: [
        '.ngrok-free.app'
      ]
    },
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
            '@tanstack/react-query': path.resolve(__dirname, './node_modules/@tanstack/react-query')
        }
    }
});
