import { defineConfig } from "vite";
import { resolve } from 'path';
import { sharedConfig } from './vite.config.shared';

export default defineConfig({
  ...sharedConfig,
  plugins: [...sharedConfig.plugins],
  build: {
    ...sharedConfig.build,
    rollupOptions: {
      ...sharedConfig.build.rollupOptions,
      input: {
        provider: resolve(__dirname, 'src/provider.ts'),
      },
      output: {
        ...sharedConfig.build.rollupOptions.output,
        entryFileNames: 'provider.js',
        chunkFileNames: () => {
          throw new Error('Chunks are not allowed for provider.js');
        },
      }
    }
  }
});
