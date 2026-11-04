/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * After filling in swap info, user on SWAP screen clicked CONTINUE action button
 */
export type SwapClickSchema = {
    eventName: string;
    /**
     * Type of swap implementation
     */
    type: 'native';
    wallet_mode: WalletModeSchema;
    asset_from: AssetSchema;
    asset_to: AssetSchema;
    /**
     * Optional. True when the user chose to swap the entire balance of asset_from.
     *
     */
    is_max?: boolean;
};

