export type CspConfig = Record<string, string[] | boolean>;

export const baseCspConfig = {
    'default-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'none'"],
    'media-src': ["'none'"],

    /* Allow loading self scripts */
    'script-src': ["'self'"],

    /* Allow using inline styles for Styled Components; allow loading Montserrat font from Google Fonts */
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com/'],

    /* Allow loading dApps images for ton connect */
    'img-src': ["'self'", 'data:', 'https:'],

    /* Allow loading Montserrat font from Google Fonts */
    'font-src': ["'self'", 'https://fonts.gstatic.com'],

    /* Allowed fetch destinations */
    'connect-src': [
        "'self'",
        'https://tonkeeper.com',
        'https://*.tonkeeper.com',
        'https://tonapi.io',
        'https://*.tonapi.io',
        'https://tonconsole.com',
        'https://*.tonconsole.com',
        'https://api.trongrid.io/'
    ],

    /* Allow loading pwa manifest */
    'manifest-src': ["'self'"],

    'upgrade-insecure-requests': true
} satisfies CspConfig;

export const httpCspConfig = {
    ...baseCspConfig,
    'frame-ancestors': ["'none'"]
};

export const metaTagCspConfig = {
    ...baseCspConfig
};

export function cspConfigContentToString(cspConfig: CspConfig) {
    return cspConfigContentToArray(cspConfig).join('; ') + ';';
}

export function cspConfigContentToArray(cspConfig: CspConfig) {
    return Object.entries(cspConfig)
        .map(([key, values]) => {
            if (typeof values === 'boolean') {
                return values ? `${key}` : '';
            } else {
                return `${key} ${values.join(' ')}`;
            }
        })
        .filter(v => v !== '');
}

export function injectCSP(config: CspConfig) {
    return {
        name: 'inject-meta-tag',
        transformIndexHtml(html: string) {
            return html.replace(
                '</head>',
                `<meta http-equiv="Content-Security-Policy" content="${cspConfigContentToString(
                    config
                )}"></head>`
            );
        }
    };
}
