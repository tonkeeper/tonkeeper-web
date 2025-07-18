import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { sharedConfig } from './vite.config.shared';

export default defineConfig(async () => {
    const { injectCSP, metaTagCspConfig } = await import('@tonkeeper/core/dist/utils/csp');
    return {
        ...sharedConfig,
        plugins: [...sharedConfig.plugins, react(), injectCSP(metaTagCspConfig)],
        publicDir: 'public',
        build: {
            ...sharedConfig.build,
            rollupOptions: {
                ...sharedConfig.build.rollupOptions,
                input: {
                    main: resolve(__dirname, 'index.html')
                },
                output: {
                    entryFileNames: 'static/js/[name].[hash].js',
                    chunkFileNames: 'static/js/[name].[hash].js',
                    assetFileNames: 'static/[name].[hash][extname]'
                }
            }
        }
    };
});
