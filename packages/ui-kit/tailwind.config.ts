import { join } from 'path';
import type { Config } from 'tailwindcss';
import preset from './src/tailwind/preset';

// Compiles the kit's own stylesheet (dist/styles.css). Consumers never load
// this file; Tailwind users extend `@tonkeeper/ui-kit/tailwind-preset`.
const config: Config = {
    presets: [preset],
    content: [join(__dirname, 'src/**/*.{ts,tsx}'), '!' + join(__dirname, 'src/**/*.ct.tsx')]
};

export default config;
