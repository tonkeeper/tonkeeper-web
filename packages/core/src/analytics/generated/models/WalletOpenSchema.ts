/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Triggered when the user opens a wallet main screen; send again if the user switches to another wallet.
 */
export type WalletOpenSchema = {
    eventName: string;
    /**
     * Wallet / address interface variant for the account whose main screen is shown (e.g. TON contract versions, Bitcoin script types). Omit or null when unknown.
     */
    wallet_interface?: 'v3R1' | 'v3R2' | 'v4R1' | 'v4R2' | 'v5Beta' | 'v5R1' | 'sigwit' | 'taproot' | null;
    /**
     * Multichain vs single-chain wallet mode.
     */
    wallet_chain: 'multi' | 'single';
    /**
     * Chain identifier when needed (e.g. single-chain / signer-chain flows); null when not applicable.
     */
    wallet_chain_id?: string | null;
    /**
     * Whether the wallet targets testnet or mainnet (multichain or single-chain).
     */
    wallet_network: 'testnet' | 'mainnet';
    /**
     * How the account is backed (keys / watch-only).
     */
    wallet_source: 'ledger' | 'keystone' | 'signer' | 'mnemonic' | 'privatekey' | 'watchonly';
};

