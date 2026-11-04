/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User removed an asset from favorites
 */
export type TradeFavoriteRemoveSchema = {
    eventName: string;
    /**
     * Where the favorite was removed from:
     *
     * - asset_details: star button on the asset detail screen
     * - favorites_section: crossed out in the Trade favorites section edit mode and committed on Done
     *
     */
    from: 'asset_details' | 'favorites_section';
    /**
     * Asset removed from favorites, in chain/network/type format: ton/mainnet/coin, ton/mainnet/jetton/{addr}
     *
     */
    asset: string;
};

