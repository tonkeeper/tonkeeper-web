import { join } from 'node:path';
import type { Config } from 'tailwindcss';
import config from './tailwind.config';

// Component stories use layout utilities that are intentionally excluded from
// the published kit stylesheet. Include them only in Playwright's CSS build.
export default {
    ...config,
    content: [join(__dirname, 'src/**/*.{ts,tsx}')]
} satisfies Config;
