import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    plugins: [nodePolyfills(), react()],
    build: {
        rollupOptions: {
            external: new RegExp(`vite-plugin-node-polyfills`)
        }
    }
});
