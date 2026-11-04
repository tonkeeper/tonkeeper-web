/**
 * Compile-time constant every shell's bundler defines from the
 * `WALLETCONNECT_PROJECT_ID` environment variable. It is a bare global
 * rather than a `process.env.*` expression on purpose: Vite's dev client
 * materialises dotted `define` keys as nested globals, so a `process.env`
 * define would install a stub `process` object before the node polyfill
 * runs, and the polyfill then keeps the stub — `process.browser` is unset
 * and CommonJS stream shims crash at import.
 */
declare const __WALLETCONNECT_PROJECT_ID__: string | undefined;

/**
 * Reown Cloud project id authenticating against the WalletConnect relay.
 * Injected at build time from the `WALLETCONNECT_PROJECT_ID` environment
 * variable — a GitHub Actions variable in CI, the repo-root `.env` file
 * locally (see `.env.example`). Empty when unset: relay init then fails,
 * so WalletConnect features require the variable to build usefully.
 *
 * Browser clients are additionally origin-checked by the Reown project
 * settings — every browser origin must be allowlisted there for pairing
 * to work. A disallowed origin fails with relay error 3000 "origin not
 * allowed" on every subscribe, surfacing as "Subscribing … failed,
 * please try again".
 *
 * The `typeof` guard keeps shells that don't define the constant (e.g.
 * twa, unit tests) from throwing at module load — they degrade to an
 * empty id instead.
 */
export const REOWN_PROJECT_ID =
    typeof __WALLETCONNECT_PROJECT_ID__ === 'string' ? __WALLETCONNECT_PROJECT_ID__ : '';

export const WALLET_CONNECT_METADATA = {
    name: 'Keeper',
    description: 'Multichain crypto wallet',
    url: 'https://tonkeeper.com',
    icons: ['https://tonkeeper.com/assets/tonconnect-icon.png']
};

export const WC_EVM_METHODS = [
    'personal_sign',
    'eth_signTypedData_v4',
    'eth_signTransaction',
    'eth_sendTransaction'
] as const;

export const WC_TRON_METHODS = ['tron_signMessage', 'tron_signTransaction'] as const;

export const WC_EVM_EVENTS = ['chainChanged', 'accountsChanged'] as const;
