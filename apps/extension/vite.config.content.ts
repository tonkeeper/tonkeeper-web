import { defineConfig } from 'vite';
import { resolve } from 'path';
import { sharedConfig } from './vite.config.shared';

export default defineConfig({
    ...sharedConfig,
    build: {
        ...sharedConfig.build,
        rollupOptions: {
            ...sharedConfig.build.rollupOptions,
            input: {
                content: resolve(__dirname, 'src/content.ts')
            },
            output: {
                ...sharedConfig.build.rollupOptions.output,
                entryFileNames: 'content.js',
                chunkFileNames: () => {
                    throw new Error('Chunks are not allowed for content.js');
                }
            }
        }
    }
});
