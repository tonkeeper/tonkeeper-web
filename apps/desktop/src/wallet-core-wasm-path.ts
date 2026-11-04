import { installWalletCoreWasmShim } from '@tonkeeper/core/dist/chains/walletCoreWasm';

// The renderer uses MemoryRouter, so `location.href` stays pinned to the
// renderer's index.html in both the dev server and the packaged `file://`
// build. The binary is emitted next to index.html by the webpack renderer
// config, so it resolves relative to that stable base.
installWalletCoreWasmShim(() => new URL('wallet-core.wasm', location.href).href);

export {};
