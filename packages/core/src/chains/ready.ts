import { loadChainkitWallet } from './chainkitLoader';

/**
 * Idempotent gate for the sync chain-kit surface (`ChainkitAdapter`'s
 * `validateAddress` and friends).
 *
 * Lazily loads the derivation/validation capability
 * (`@tonkeeper/chainkit/web/wallet`) — deliberately NOT the full networked
 * SDK — and resolves once its Wallet Core lifecycle finished. Callers
 * `await` this before any sync adapter method so they don't need to know
 * who else has already initialised chain-kit. Transfer / swap /
 * WalletConnect flows load the full SDK separately via `loadChainkit()`
 * in `chainkitLoader.ts`.
 *
 * Errors are surfaced and the memo resets, so a transient failure (e.g. a
 * missing wasm fetch shim) can be retried once the environment is fixed.
 */
export const ensureReady = async (): Promise<void> => {
    await loadChainkitWallet();
};
