import { useEffect } from 'react';
import { ensureReady } from '@tonkeeper/core/dist/chains/ready';
import { useAccountsState } from '../state/wallet';

/**
 * Warm chain-kit's Kotlin/JS + Trust Wallet Core wasm at app start, once a
 * multichain account exists. This moves the ~10 MB wasm init out of the first
 * wallet-creation / signing flow and makes a load or CSP failure surface at
 * boot instead of as a failed account creation. `chains/types.ts` documents
 * that startup should await `ensureReady()`.
 *
 * No-op for legacy (TON-only) profiles — they never touch chain-kit, so the
 * wasm is not loaded for them.
 */
export const useEnsureChainKitReady = (): void => {
    const hasMultichainAccount = useAccountsState().some(account => account.type === 'multichain');

    useEffect(() => {
        if (hasMultichainAccount) {
            ensureReady().catch(e => console.error('chain-kit preload failed', e));
        }
    }, [hasMultichainAccount]);
};
