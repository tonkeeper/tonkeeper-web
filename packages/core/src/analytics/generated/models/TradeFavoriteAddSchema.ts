/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User added an asset to favorites
 */
export type TradeFavoriteAddSchema = {
    eventName: string;
    /**
     * Where the favorite was added from:
     *
     * - asset_details: star button on the asset detail screen
     *
     */
    from: 'asset_details';
    /**
     * Asset added to favorites, in chain/network/type format: ton/mainnet/coin, ton/mainnet/jetton/{addr}
     *
     */
    asset: string;
};

