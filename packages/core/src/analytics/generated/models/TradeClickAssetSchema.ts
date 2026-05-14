/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User clicked an asset from the Trade page
 */
export type TradeClickAssetSchema = {
    eventName: string;
    /**
     * Carried from trade_started
     */
    from: 'wallet_screen' | 'jetton_screen' | 'tab_bar' | 'deep_link' | 'qr_code';
    /**
     * Asset clicked, in chain/network/type format: ton/mainnet/coin, ton/mainnet/jetton/{addr}
     *
     */
    asset: string;
};

