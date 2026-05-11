/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User searched for an asset in the Trade section. Must be sent at the same time and with the same query as the API request.
 *
 */
export type TradeSearchSchema = {
    eventName: string;
    /**
     * Carried from trade_started
     */
    from: 'wallet_screen' | 'jetton_screen' | 'tab_bar' | 'deep_link' | 'qr_code';
    /**
     * Text of the search query entered by the user
     */
    query?: string;
};

