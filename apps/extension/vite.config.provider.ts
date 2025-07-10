import { defineConfig } from "vite";
import { resolve } from 'path';
import { sharedConfig } from './vite.config.shared';

export default defineConfig({
  ...sharedConfig,
  build: {
    ...sharedConfig.build,
    minify: false,
    rollupOptions: {
      ...sharedConfig.build.rollupOptions,
      input: {
        provider: resolve(__dirname, 'src/provider.ts'),
      },
      output: {
        ...sharedConfig.build.rollupOptions.output,
        entryFileNames: 'provider.js',
        inlineDynamicImports: true,
        chunkFileNames: () => {
          throw new Error('Chunks are not allowed for provider.js');
        },
        intro: '(function(){',
        outro: '})();'
      },
      treeshake: {
        moduleSideEffects: false
      },
    },
  }
});
