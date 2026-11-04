/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Canonical chain identifier. For a concrete on-chain asset it is the first
 * segment of its Asset ID (chain/network/type[/addr]; see docs/ASSET_ID.md and
 * docs/MULTICHAIN_ARCHITECTURE.md) — lowercase and stable across platforms.
 * EVM chains (eth / base / arb / pol / bnb / avax / robinhood) share one signing stack but keep
 * distinct ids; the BitcoinLike family (ltc / doge / bch) is config-driven.
 * Network (mainnet / testnet) is a separate Asset ID segment, not part of this enum.
 * The special value `multichain` marks an entity (e.g. a dapp) that spans several
 * chains rather than being tied to one — it is NOT a valid Asset ID prefix.
 *
 * - ton:  TON
 * - eth:  Ethereum
 * - base: Base
 * - arb:  Arbitrum
 * - bnb:  BNB Chain
 * - pol:  Polygon
 * - avax: Avalanche C-Chain
 * - robinhood: Robinhood Chain
 * - sol:  Solana
 * - tron: TRON
 * - btc:  Bitcoin
 * - ltc:  Litecoin
 * - doge: Dogecoin
 * - bch:  Bitcoin Cash
 * - multichain: spans several chains (dapps only; not an Asset ID prefix)
 *
 */
export type AssetChainSchema = 'ton' | 'eth' | 'base' | 'arb' | 'bnb' | 'pol' | 'avax' | 'robinhood' | 'sol' | 'tron' | 'btc' | 'ltc' | 'doge' | 'bch' | 'multichain';
