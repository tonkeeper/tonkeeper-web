/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User opened an asset detail screen. Replaces the legacy token_open event, which should be removed from the existing codebase.
 *
 */
export type AssetViewSchema = {
    eventName: string;
    /**
     * Source location where the asset view was opened:
     * | wallet_screen: main wallet screen
     * | deep_link: from deep link
     * | qr_code: user scans a QR code
     * | trade_screen: from Trade UI (via trade_click_asset or trade_search_click)
     *
     */
    from: 'wallet_screen' | 'deep_link' | 'qr_code' | 'trade_screen';
    /**
     * Asset clicked, in chain/network/type format: ton/mainnet/coin, ton/mainnet/jetton/{addr}
     *
     */
    asset: string;
};

