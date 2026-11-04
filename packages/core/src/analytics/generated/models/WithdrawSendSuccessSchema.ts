/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
import type { FeeAssetSchema } from './FeeAssetSchema';
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * Stablecoin withdrawal transaction completed successfully
 */
export type WithdrawSendSuccessSchema = {
    eventName: string;
    from: RampSourceSchema;
    withdraw_option: WithdrawOptionSchema;
    sell_asset: AssetSchema;
    /**
     * Carried from withdraw_click_stablecoin
     */
    stablecoin_symbol: string;
    buy_asset: AssetSchema;
    /**
     * Carried from withdraw_click_insert_amount_continue
     */
    amount: number;
    fee_asset: FeeAssetSchema;
};

