import BigNumber from 'bignumber.js';

import { chainkitWallet, loadChainkitWallet } from './chainkitLoader';
import {
    BuildTxArgs,
    ChainAdapter,
    ChainId,
    ChainSigner,
    DerivedKeys,
    NotImplementedError
} from './types';

/**
 * Chain-kit-backed `ChainAdapter`, on top of the browser-optimized
 * `@tonkeeper/chainkit/web/wallet` capability (derivation + validation
 * only — no mediators, no networking, ~⅓ of the root bundle).
 *
 * Read-side operations (`validateAddress`, `formatAmount`, `parseAmount`,
 * `deriveKeys`) are wired. Write-side operations
 * (`estimateFee`, `buildTransaction`, `signTransaction`, `broadcast`)
 * throw `NotImplementedError`:
 *
 * - TON's version-aware pubkey → address derivation goes through
 *   `walletContract()` in `service/wallet/contractService.ts`. The
 *   chain-agnostic shape here is too narrow for that path.
 * - Sign / build / broadcast paths live in their existing service
 *   modules.
 *
 * `ensureReady()` must be awaited at flow entry (and in tests'
 * `beforeAll`) before any sync method is called. `validateAddress` is
 * sync, so chain-kit's lifecycle can't be awaited inline.
 */

/** The web/wallet chain-id string for a `ChainId`; throws for chains chain-kit lacks. */
const chainStringOf = (id: ChainId): string => {
    switch (id) {
        case 'ton':
            return 'ton';
        case 'evm':
            return 'eth';
        case 'btc':
            return 'btc';
        case 'tron':
            return 'tron';
        case 'sol':
            throw new NotImplementedError(
                'sol',
                'validateAddress',
                'chain-kit has no Solana module'
            );
    }
};

/** Default smallest-unit decimals for the chain's native coin. */
const DEFAULT_DECIMALS: Record<ChainId, number> = {
    ton: 9,
    evm: 18,
    btc: 8,
    tron: 6,
    sol: 9
};

class ChainkitAdapter implements ChainAdapter {
    constructor(public readonly chain: ChainId) {}

    validateAddress(addr: string): boolean {
        try {
            return chainkitWallet().validateAddress(addr, chainStringOf(this.chain));
        } catch {
            // sol throws from chainStringOf(); malformed input that confuses
            // chain-kit (rather than just returning false) also lands here.
            return false;
        }
    }

    formatAmount(amount: bigint, opts?: { decimals?: number }): string {
        const decimals = opts?.decimals ?? DEFAULT_DECIMALS[this.chain];
        return new BigNumber(amount.toString()).shiftedBy(-decimals).toFixed();
    }

    parseAmount(human: string, opts?: { decimals?: number }): bigint {
        const decimals = opts?.decimals ?? DEFAULT_DECIMALS[this.chain];
        const bn = new BigNumber(human);
        if (bn.isNaN()) {
            throw new Error(`parseAmount: invalid numeric string "${human}"`);
        }
        if ((bn.decimalPlaces() ?? 0) > decimals) {
            throw new Error(`parseAmount: "${human}" exceeds ${decimals} decimals`);
        }
        return BigInt(bn.shiftedBy(decimals).toFixed(0));
    }

    async deriveKeys(args: { mnemonic: string }): Promise<DerivedKeys> {
        if (this.chain === 'sol') {
            throw new NotImplementedError('sol', 'deriveKeys', 'chain-kit has no Solana module');
        }
        if (this.chain === 'ton') {
            // TON addresses are wallet-version-aware (V4R2 vs V5R1 vs …) — the
            // address-from-mnemonic shape on this adapter can't pick a version.
            // Multichain account creation derives the TON pubkey via
            // `bip39MnemonicToEd25519Seed` and resolves the address through
            // `walletContract(pubkey, version)` directly.
            throw new NotImplementedError(
                'ton',
                'deriveKeys',
                'TON addresses are version-aware — use walletContract() in service/wallet/contractService.ts'
            );
        }
        const wallet = await loadChainkitWallet();
        // "default" resolves to the chain's canonical variant inside chain-kit
        // (SegWit for Bitcoin — the only supported Bitcoin encoding).
        const derived = wallet.deriveAddress(args.mnemonic, chainStringOf(this.chain));
        // chain-kit prefixes the pubkey with `0x`; the per-chain wallet types
        // (`EvmWallet`/`BtcWallet`/…) document plain hex. Strip it so the
        // stored value matches the documented shape and is uniform per chain.
        const hex = derived.publicKeyHex;
        return {
            address: derived.address,
            publicKey: hex.startsWith('0x') ? hex.slice(2) : hex
        };
    }

    async estimateFee(): Promise<never> {
        throw new NotImplementedError(this.chain, 'estimateFee', 'not wired yet');
    }

    async buildTransaction(_args: BuildTxArgs): Promise<unknown> {
        throw new NotImplementedError(this.chain, 'buildTransaction', 'not wired yet');
    }

    async signTransaction(_args: { message: unknown; signer: ChainSigner }): Promise<unknown> {
        throw new NotImplementedError(
            this.chain,
            'signTransaction',
            this.chain === 'ton'
                ? 'TON signing lives in the signer factory, not on the adapter'
                : 'not wired yet'
        );
    }

    async broadcast(): Promise<{ hash: string }> {
        throw new NotImplementedError(this.chain, 'broadcast', 'not wired yet');
    }
}

export const buildAdapter = (chain: ChainId): ChainAdapter => new ChainkitAdapter(chain);
