import react from '@vitejs/plugin-react';
import rollupNodePolyfills from 'rollup-plugin-polyfill-node';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => ({
    plugins: mode === 'development' ? [nodePolyfills(), react()] : [],
    build: {
        rollupOptions: {
            plugins: [rollupNodePolyfills()]
        }
    }
}));
