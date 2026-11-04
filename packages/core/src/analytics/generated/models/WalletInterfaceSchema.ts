/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Address / account interface of a wallet. The vocabulary is per-chain; the
 * chain is implied by context (the `asset` on `transaction_sent`, the single
 * chain on `wallet_open`):
 *
 * - TON: v1R1 | v1R2 | v1R3 | v2R1 | v2R2 | v3R1 | v3R2 | v4R1 | v4R2 | v5Beta | v5R1 (W5)
 * - Bitcoin: legacy (P2PKH) | p2sh (nested SegWit) | segwit (native P2WPKH) | taproot (P2TR)
 * - EVM (Ethereum/Base/Arbitrum/Polygon/BNB), TRON, Solana: eoa | smart_account (ERC-4337 account abstraction)
 *
 * Always present on `transaction_sent` (the submitting wallet). On `wallet_open`
 * it is optional and set only for single-chain wallets (`wallet_mode = single`);
 * multichain wallets span several interfaces, so it is omitted there.
 *
 */
export type WalletInterfaceSchema = 'v1R1' | 'v1R2' | 'v1R3' | 'v2R1' | 'v2R2' | 'v3R1' | 'v3R2' | 'v4R1' | 'v4R2' | 'v5Beta' | 'v5R1' | 'legacy' | 'p2sh' | 'segwit' | 'taproot' | 'eoa' | 'smart_account';
