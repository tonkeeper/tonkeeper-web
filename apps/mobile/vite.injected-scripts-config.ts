import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    build: {
        outDir: './ios/App/App',
        emptyOutDir: false,
        minify: false,
        lib: {
            entry: path.resolve(__dirname, 'src/inject-scripts/index.ts'),
            name: 'InjectedScript',
            fileName: () => 'injected.js',
            formats: ['iife']
        },
        rollupOptions: {
            output: {
                inlineDynamicImports: true
            },
            treeshake: {
                moduleSideEffects: false
            }
        }
    }
});
