/**
 * Lazy loading boundary for `@tonkeeper/chainkit`.
 *
 * Nothing outside this module may import chain-kit *values* statically: every
 * consumer goes through these loaders, so the SDK lands in its own async
 * chunks, downloaded when a transactional flow first needs it — never in the
 * initial bundle that renders Home/portfolio.
 *
 * Two entries are used:
 * - `@tonkeeper/chainkit/web/wallet` — derivation + validation only (~⅓ the JS
 *   of the root bundle; no networking, no mediators). Loaded by
 *   `ensureReady()` for the sync adapter methods and by wallet-creation flows.
 * - the root package — the full networked SDK (mediators: balances, fee
 *   estimation, sign, broadcast). Loaded on the first transfer / swap /
 *   WalletConnect send.
 *
 * Each loader awaits its entry's own `ready()` (Wallet Core WASM boot) before
 * resolving and memoizes the promise; a failed load resets the memo so a
 * transient failure can be retried.
 */

export type ChainkitRoot = typeof import('@tonkeeper/chainkit');
export type ChainkitWalletModule = typeof import('@tonkeeper/chainkit/web/wallet');

let rootPromise: Promise<ChainkitRoot> | null = null;
let rootModule: ChainkitRoot | null = null;

export const loadChainkit = (): Promise<ChainkitRoot> => {
    if (!rootPromise) {
        rootPromise = import('@tonkeeper/chainkit')
            .then(async m => {
                await m.ready();
                rootModule = m;
                return m;
            })
            .catch(e => {
                rootPromise = null;
                throw e;
            });
    }
    return rootPromise;
};

/**
 * Sync access to the root SDK for helpers documented to run only after
 * `loadChainkit()` resolved (e.g. everything downstream of
 * `getChainKitMediator`).
 */
export const chainkit = (): ChainkitRoot => {
    if (!rootModule) {
        throw new Error('chain-kit is not loaded — await loadChainkit() first');
    }
    return rootModule;
};

/** The root SDK when it has been loaded, without forcing a load. */
export const loadedChainkit = (): ChainkitRoot | null => rootModule;

let walletPromise: Promise<ChainkitWalletModule> | null = null;
let walletModule: ChainkitWalletModule | null = null;

export const loadChainkitWallet = (): Promise<ChainkitWalletModule> => {
    if (!walletPromise) {
        walletPromise = import('@tonkeeper/chainkit/web/wallet')
            .then(async m => {
                await m.ready();
                walletModule = m;
                return m;
            })
            .catch(e => {
                walletPromise = null;
                throw e;
            });
    }
    return walletPromise;
};

/**
 * Sync access to the derivation/validation capability for the adapter's sync
 * methods; requires `ensureReady()` to have been awaited first.
 */
export const chainkitWallet = (): ChainkitWalletModule => {
    if (!walletModule) {
        throw new Error('chain-kit wallet module is not loaded — await ensureReady() first');
    }
    return walletModule;
};
