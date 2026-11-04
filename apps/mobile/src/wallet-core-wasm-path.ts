import { installWalletCoreWasmShim } from '@tonkeeper/core/dist/chains/walletCoreWasm';

// The Capacitor webview serves the build output from its root, so the binary
// (emitted to the bundle root by the vite plugin) is reachable at the site
// root; chain-kit's loader otherwise resolves it against the current route.
installWalletCoreWasmShim(() => '/wallet-core.wasm');

export {};
