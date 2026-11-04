import browser from 'webextension-polyfill';
import { installWalletCoreWasmShim } from '@tonkeeper/core/dist/chains/walletCoreWasm';

// The binary is copied to the extension root at build time; chain-kit's loader
// otherwise resolves it against the popup / service-worker script path and the
// request 404s. `runtime.getURL` yields the packaged `chrome-extension://…`
// URL, valid from both the popup page and the background worker.
installWalletCoreWasmShim(() => browser.runtime.getURL('wallet-core.wasm'));

export {};
