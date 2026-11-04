/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
import type { FeeAssetSchema } from './FeeAssetSchema';
import type { WalletModeSchema } from './WalletModeSchema';
/**
 * Swap failed
 */
export type SwapFailedSchema = {
    eventName: string;
    /**
     * Type of swap implementation
     */
    type: 'native';
    wallet_mode: WalletModeSchema;
    asset_from: AssetSchema;
    asset_to: AssetSchema;
    fee_asset: FeeAssetSchema;
    /**
     * Name of the swap provider (e.g. stonfi, dedust, swap.coffee)
     */
    provider_name: string;
    /**
     * Error message returned for the failed swap
     */
    error_message: string;
    /**
     * Optional. True when the user chose to swap the entire balance of asset_from.
     *
     */
    is_max?: boolean;
};

