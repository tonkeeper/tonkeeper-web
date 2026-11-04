/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User clicked an asset in the Trade favorites section
 */
export type TradeFavoriteClickSchema = {
    eventName: string;
    /**
     * Asset the user clicked, in chain/network/type format: ton/mainnet/coin, ton/mainnet/jetton/{addr}
     *
     */
    asset: string;
    /**
     * Zero-based index of the asset within the favorites row
     */
    position: number;
};

