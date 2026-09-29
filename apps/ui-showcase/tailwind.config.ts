import { join } from 'path';
import type { Config } from 'tailwindcss';
import preset from '../../packages/ui-kit/src/tailwind/preset';

const config: Config = {
    presets: [preset],
    content: [
        join(__dirname, 'src/**/*.{ts,tsx}'),
        join(__dirname, '../../packages/ui-kit/src/**/*.{ts,tsx}')
    ]
};

export default config;
