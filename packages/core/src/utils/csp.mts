// Default (namespace) import: `csp.mts` compiles to native ESM (`.mjs`), and
// chain-kit is CommonJS — Node's ESM interop can't statically see its named
// exports, but the default binding is the whole `module.exports`.
import chainkit from '@tonkeeper/chainkit';

export type CspConfig = Record<string, string[] | boolean>;

export const baseCspConfig = {
    'default-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'none'"],
    'media-src': ["'none'"],

    /* Allow loading self scripts; 'wasm-unsafe-eval' is required by @tonkeeper/chainkit / Trust Wallet Core
     * to compile its WebAssembly module. Does NOT enable eval()/Function(). */
    'script-src': ["'self'", "'wasm-unsafe-eval'"],

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
        'https://duckduckgo.com',
        'https://oauth.telegram.org',

        /* WalletConnect: the Reown relay websocket carrying dApp sessions, the
         * Verify API attestations behind the connect-sheet risk states, and the
         * SDK usage-event beacon. The beacon fires on Core init regardless of
         * the `telemetryEnabled` flag in this SDK version, and both native apps
         * keep telemetry on against the shared Reown project, so web matches
         * them rather than being the one shell that drops its sessions. */
        'wss://relay.walletconnect.org',
        'wss://relay.walletconnect.com',
        'https://verify.walletconnect.org',
        'https://pulse.walletconnect.org',

        /* Third-party node providers @tonkeeper/chainkit reaches for
         * multichain estimate/broadcast (TON / EVM / BTC / TRON). Sourced from
         * chain-kit's own origin list so the allowlist tracks the SDK instead
         * of a hand-maintained copy that silently drifts. CSP matches by host
         * and ignores the path. */
        ...chainkit.rpcOrigins()
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
