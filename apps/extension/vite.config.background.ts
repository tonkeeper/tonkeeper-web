import { defineConfig } from "vite";
import { resolve } from 'path';
import { sharedConfig } from './vite.config.shared';

export default defineConfig({
  ...sharedConfig,
  build: {
    ...sharedConfig.build,
    rollupOptions: {
      ...sharedConfig.build.rollupOptions,
      input: {
        background: resolve(__dirname, 'src/background.ts'),
      },
      output: {
        ...sharedConfig.build.rollupOptions.output,
        entryFileNames: 'background.js',
        chunkFileNames: () => {
          throw new Error('Chunks are not allowed for background.js');
        },
      }
    }
  }
});
