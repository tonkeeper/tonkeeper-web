import { defineConfig } from 'vite';
import path from 'path';
import { createRequire } from 'module';

// Vite bundles this config to ESM, where `require` is undefined; recreate it.
const nodeRequire = createRequire(import.meta.url);

// CommonJS script shared with every shell's build config; see its header.
const { readAppVersion } = nodeRequire('../../scripts/app-version.js');

export default defineConfig({
    define: {
        __APP_VERSION__: JSON.stringify(readAppVersion(__dirname))
    },
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
