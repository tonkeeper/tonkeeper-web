import { readdirSync } from 'fs';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const iconEntries = readdirSync(resolve(__dirname, 'src/icons/components'))
    .filter(file => /\.tsx?$/.test(file))
    .map(file => resolve(__dirname, 'src/icons/components', file));

// One output file per source module, so a consumer's bundler drops every
// component and icon it doesn't import.
export default defineConfig({
    esbuild: { jsx: 'automatic' },
    build: {
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: true,
        minify: false,
        lib: {
            entry: [
                resolve(__dirname, 'src/index.ts'),
                resolve(__dirname, 'src/tailwind/preset.ts'),
                ...iconEntries
            ],
            formats: ['es']
        },
        rollupOptions: {
            external: [/^react($|\/)/, /^react-dom($|\/)/, /^tailwindcss($|\/)/],
            output: {
                preserveModules: true,
                preserveModulesRoot: 'src',
                entryFileNames: '[name].js'
            }
        }
    }
});
