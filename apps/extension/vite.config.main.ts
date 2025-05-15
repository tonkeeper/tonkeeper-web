import { defineConfig } from "vite";
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { sharedConfig } from './vite.config.shared';

export default defineConfig({
  ...sharedConfig,
  plugins: [...sharedConfig.plugins, react()],
  publicDir: 'public',
  build: {
    ...sharedConfig.build,
    rollupOptions: {
      ...sharedConfig.build.rollupOptions,
      input: {
        main: resolve(__dirname, 'index.html'), // ключевой момент — используем index.html как entry
      },
      output: {
        entryFileNames: 'static/js/[name].[hash].js',
        chunkFileNames: 'static/js/[name].[hash].js',
        assetFileNames: 'static/[name].[hash][extname]'
      }
    }
  }
});
