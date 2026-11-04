/// <reference types="vite/client" />

/** Site-root URL of Trust Wallet Core's wasm; injected by `vite.config.mts`. */
declare const __WALLET_CORE_WASM_URL__: string;

/** Version reported to the backends; injected by the build config via `scripts/app-version.js`. */
declare const __APP_VERSION__: string;

/** Origin the wallet is migrating away from; injected by `vite.config.mts`. */
declare const __MIGRATION_OLD_ORIGIN__: string;

/** Origin this build is served from; injected by `vite.config.mts`. */
declare const __MIGRATION_NEW_ORIGIN__: string;
