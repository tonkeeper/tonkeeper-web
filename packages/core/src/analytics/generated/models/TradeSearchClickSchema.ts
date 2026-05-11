/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User clicked on an asset in the Trade search results
 */
export type TradeSearchClickSchema = {
    eventName: string;
    /**
     * Carried from trade_started
     */
    from: 'wallet_screen' | 'jetton_screen' | 'tab_bar' | 'deep_link' | 'qr_code';
    /**
     * Carried from trade_search
     */
    query?: string;
    /**
     * Asset the user clicked, in chain/network/type format: ton/mainnet/coin, ton/mainnet/jetton/{addr}
     *
     */
    asset: string;
};

