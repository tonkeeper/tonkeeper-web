import { installWalletCoreWasmShim } from '@tonkeeper/core/dist/chains/walletCoreWasm';

// The web build serves the binary from a version-scoped path under the site
// root (see `vite.config.mts`); chain-kit's loader otherwise resolves it
// against the current SPA route and the fallback answers with HTML. See
// `installWalletCoreWasmShim`.
installWalletCoreWasmShim(() => __WALLET_CORE_WASM_URL__);

export {};
