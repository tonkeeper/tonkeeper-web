/**
 * Multichain interface used by `uikit`. Hides chain-kit's Kotlin/JS
 * ergonomics (`Companion.from(...)`, `Res<T,E>`, `await ready()`,
 * `Int8Array` vs `Uint8Array`) behind a clean TS surface.
 *
 * Chain-specific *transaction* code (TON wallet versions, MAM, multisig;
 * EVM EIP-712; BTC PSBT; etc.) lives in the existing service modules —
 * the signer factory and wallet contract factory — not through this
 * facade.
 */

export type ChainId = 'ton' | 'evm' | 'btc' | 'tron' | 'sol';

export const CHAIN_IDS: readonly ChainId[] = ['ton', 'evm', 'btc', 'tron', 'sol'] as const;

/**
 * Placeholder for the per-chain signer discriminated union (`{ type:
 * 'cell' | 'eth-typed' | ... }`) that the signer factory will own. Typed
 * loosely here so the adapter interface compiles independently of the
 * factory rollout.
 */
export type ChainSigner = unknown;

/**
 * Inputs for `ChainAdapter.buildTransaction`. The shape is intentionally
 * generic so per-chain code can refine `extra` for its own payload
 * (TON: messages + sendMode; EVM: gas/data; BTC: utxos; etc.).
 */
export interface BuildTxArgs {
    from: string;
    to: string;
    amount: bigint;
    extra?: unknown;
}

export interface Fee {
    /** Fee amount in the chain's smallest unit (nanoton, wei, satoshi, sun, lamport). */
    amount: bigint;
    /** Free-form breakdown; consumers can render or ignore. */
    breakdown?: ReadonlyArray<{ label: string; amount: bigint }>;
}

export interface DerivedKeys {
    address: string;
    /** Plain hex, no `0x` prefix. */
    publicKey: string;
}

export interface ChainAdapter<TMessage = unknown, TSignature = unknown> {
    readonly chain: ChainId;

    /**
     * Whether `addr` is a syntactically valid address on this chain.
     * Backed by chain-kit's `Address.Companion.from(addr, chain)`.
     *
     * `ensureReady()` must have been awaited before the first call.
     * Tests should `await ensureReady()` in `beforeAll`; app startup
     * should `await ensureReady()` at boot.
     */
    validateAddress(addr: string): boolean;

    /**
     * Format a raw amount (smallest unit) into a human string. Default
     * decimals come from the chain's coin (e.g. TON = 9). Override
     * `opts.decimals` for jettons / ERC-20 / SPL etc.
     */
    formatAmount(amount: bigint, opts?: { decimals?: number }): string;

    /** Inverse of `formatAmount`. Throws on malformed input. */
    parseAmount(human: string, opts?: { decimals?: number }): bigint;

    /**
     * Derive the canonical address and public key for this chain from a
     * BIP39 mnemonic in one chain-kit call. Chain-kit walks the mnemonic
     * at the chain's standard BIP-44 path (`DEFAULT_BIP44_PATH[chain]`)
     * and returns the chain's canonical address shape (EIP-55 checksum on
     * EVM, bech32 on BTC, base58 on TRON, etc.) together with the plain
     * hex public key: EVM and TRON return uncompressed secp256k1
     * (`04` || X || Y), BTC returns compressed secp256k1.
     *
     * Both values come from a single derivation because that is the
     * expensive step (an HD walk inside Wallet Core); account creation
     * needs both per chain.
     *
     * TON is intentionally not wired here: TON addresses depend on the
     * wallet contract version (V4R2, V5R1, …), which only the existing
     * `walletContract()` helper in `service/wallet/contractService.ts`
     * knows how to choose, and the TON pubkey comes from
     * `bip39MnemonicToEd25519Seed`. The TON branch throws.
     *
     * SOL is not wired either: chain-kit ships no Solana module today.
     * The SOL branch throws until that lands.
     */
    deriveKeys(args: { mnemonic: string }): Promise<DerivedKeys>;

    estimateFee(args: { from: string; to: string; amount: bigint; data?: unknown }): Promise<Fee>;
    buildTransaction(args: BuildTxArgs): Promise<TMessage>;
    signTransaction(args: { message: TMessage; signer: ChainSigner }): Promise<TSignature>;
    broadcast(args: { signed: TSignature }): Promise<{ hash: string }>;
}

export class NotImplementedError extends Error {
    constructor(chain: ChainId, method: keyof ChainAdapter, reason: string) {
        super(
            `ChainAdapter for "${chain}" has no ${String(method)}() implementation — ` +
                `${reason}. See packages/core/src/chains/adapter.ts.`
        );
        this.name = 'NotImplementedError';
    }
}
