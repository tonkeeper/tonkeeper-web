/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
import type { FeeAssetSchema } from './FeeAssetSchema';
import type { InitiatedBySchema } from './InitiatedBySchema';
import type { LedgerModelSchema } from './LedgerModelSchema';
import type { UrlSchema } from './UrlSchema';
import type { WalletInterfaceSchema } from './WalletInterfaceSchema';
import type { WalletModeSchema } from './WalletModeSchema';
import type { WalletSourceSchema } from './WalletSourceSchema';
/**
 * Sent once when any blockchain transaction is submitted, on any supported chain (TON, TRON, BTC, EVM: Ethereum / Base / Arbitrum / Polygon / BNB Chain, Solana). This is the single cross-cutting "transaction submitted" signal and is emitted in addition to any flow-specific event — e.g. send_success remains a separate send-flow event and is NOT replaced by transaction_sent.
 * Chain and network are NOT separate fields: they are carried inside `asset` (and `to_asset`) in chain/network/type[/addr] format. The structure mirrors the client Transaction model: `category` is the top-level transaction kind and `category_detail` is the variant within it.
 * `initiated_by` says who asked for the transaction — the user inside the wallet, or an external dapp over TON Connect, WalletConnect, or an injected EVM provider. It makes transaction_sent self-sufficient: dapp-driven volume no longer has to be inferred by correlating with tc_send_success / send_success on user + timestamp.
 *
 */
export type TransactionSentSchema = {
    eventName: string;
    /**
     * Top-level transaction kind (mirrors the client Transaction sealed type):
     *
     * - transfer: a coin / token / NFT transfer
     * - swap: an asset swap (on-chain or cross-chain)
     * - call: a generic smart-contract call
     * - staking: a staking operation (the specific op is in category_detail)
     *
     */
    category: 'transfer' | 'swap' | 'call' | 'staking';
    /**
     * Variant within `category` (required). The allowed value depends on `category`:
     *
     * - transfer → coin | token | nft
     * - swap     → onchain | cross_chain   (cross_chain when `asset` and `to_asset` are on different chains)
     * - call     → domain_renew | subscription | multisig | deploy | unknown
     * - staking  → stake | unstake | claim | restake | compound
     *
     * `restake` and `compound` are not reachable on the native clients:
     * their staking UI offers stake, unstake and collect only — pooled and
     * liquid alike — so their absence there is a missing operation, not a
     * decline in restaking, and must not be read as one. They stay in the
     * enum for clients that do offer the operation; instrument them if the
     * operation ever ships.
     *
     */
    category_detail: 'coin' | 'token' | 'nft' | 'onchain' | 'cross_chain' | 'domain_renew' | 'subscription' | 'multisig' | 'deploy' | 'unknown' | 'stake' | 'unstake' | 'claim' | 'restake' | 'compound';
    asset: AssetSchema;
    /**
     * Human-readable amount, already normalized by the asset's decimals (e.g. 1.5 for 1.5 TON, 0.00012 for BTC) — NOT the raw on-chain integer. May be 0 (e.g. for some contract calls).
     *
     */
    amount: number;
    fee_asset: FeeAssetSchema;
    wallet_interface: WalletInterfaceSchema;
    wallet_source: WalletSourceSchema;
    wallet_mode: WalletModeSchema;
    initiated_by: InitiatedBySchema;
    /**
     * Optional. app_id value passed from backend, same as app_id in dapp_* events. Set when initiated_by is a dapp origin AND the dapp is in the catalog (arbitrary websites have no app_id — use dapp_url for those).
     *
     */
    app_id?: string;
    dapp_url?: UrlSchema;
    /**
     * Optional. True when the user chose to move the entire balance (applies to transfer / swap / stake / unstake).
     *
     */
    is_max?: boolean;
    /**
     * Optional, swap only. The destination asset in chain/network/type[/addr] format. A cross-chain swap is when its chain differs from `asset`'s chain (in which case category_detail = cross_chain).
     *
     */
    to_asset?: string;
    /**
     * Optional, staking only. Validator / pool identifier the operation targets.
     */
    staking_provider?: string;
    /**
     * Optional, staking only. True for liquid staking, false for native staking.
     */
    is_liquid?: boolean;
    ledger_model?: LedgerModelSchema;
};

