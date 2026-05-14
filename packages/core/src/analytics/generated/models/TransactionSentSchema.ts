/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Sent when any blockchain transaction is submitted
 */
export type TransactionSentSchema = {
    eventName: string;
    /**
     * Type of blockchain transaction. The list can change, see https://github.com/tonkeeper/opentonapi/blob/c8aaa99c99827f4a8158a8345b518c3b84fbd958/api/openapi.yml#L6099
     */
    event_type: 'TonTransfer' | 'ExtraCurrencyTransfer' | 'ContractDeploy' | 'JettonTransfer' | 'FlawedJettonTransfer' | 'JettonBurn' | 'JettonMint' | 'NftItemTransfer' | 'Subscribe' | 'UnSubscribe' | 'AuctionBid' | 'NftPurchase' | 'DepositStake' | 'WithdrawStake' | 'WithdrawStakeRequest' | 'ElectionsDepositStake' | 'ElectionsRecoverStake' | 'JettonSwap' | 'SmartContractExec' | 'DomainRenew' | 'Purchase' | 'AddExtension' | 'RemoveExtension' | 'SetSignatureAllowedAction' | 'GasRelay' | 'DepositTokenStake' | 'WithdrawTokenStakeRequest' | 'LiquidityDeposit' | 'Unknown';
    /**
     * Wallet / address interface variant for the account that submitted the transaction (e.g. TON contract versions, Bitcoin script types). Omit or null when unknown.
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

