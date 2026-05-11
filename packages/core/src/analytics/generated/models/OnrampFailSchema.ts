/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Onramp transaction failed
 */
export type OnrampFailSchema = {
    readonly eventName?: 'onramp_fail';
    /**
     * TransactionID (uuid)
     */
    tx_id?: string;
    /**
     * Type of onramp transaction
     */
    type: 'buy' | 'sell' | 'swap';
    /**
     * Network of the asset being sold (e.g., 'fiat', 'ton', 'btc', 'trc20', 'erc20', 'sol')
     */
    sell_asset_network: string;
    /**
     * Symbol of the asset being sold (e.g., 'usd', 'eur', 'ton', 'usdt', 'trx', 'btc')
     */
    sell_asset_symbol: string;
    /**
     * Amount of the asset being sold
     */
    sell_amount: number;
    /**
     * Network of the asset being bought (e.g., 'fiat', 'ton', 'btc', 'trc20', 'erc20', 'sol')
     */
    buy_asset_network: string;
    /**
     * Symbol of the asset being bought (e.g., 'usd', 'eur', 'ton', 'usdt', 'trx', 'btc')
     */
    buy_asset_symbol: string;
    /**
     * Amount of the asset being bought
     */
    buy_amount: number;
    /**
     * Country code for the transaction
     */
    country_code: string | null;
    /**
     * Selected payment method (examples: apple_pay, google_pay, paypal, card, sepa, venmo, revolut, pix, volt)
     */
    payment_method: string;
    /**
     * Name of the onramp provider
     */
    provider_name: string;
    /**
     * Domain of the onramp provider
     */
    provider_domain: string;
    /**
     * Error code for the failed onramp
     */
    error_code?: string | null;
    /**
     * Error message for the failed onramp
     */
    error_message?: string | null;
};

