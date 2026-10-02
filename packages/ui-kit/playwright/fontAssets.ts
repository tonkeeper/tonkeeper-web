import { fileURLToPath } from 'node:url';

export const FONT_BASE_URL = 'https://fonts.keeperwallet.com/v1/';
// Playwright rebuilds playwright/.cache, so keep downloaded fonts outside it.
export const FONT_CACHE_DIR = fileURLToPath(new URL('../.cache/fonts/', import.meta.url));
export const FONT_FILES = [
    'TT-Firs-Neue-Normal.woff2',
    'TT-Firs-Neue-Medium.woff2',
    'TT-Firs-Neue-DemiBold.woff2'
] as const;
