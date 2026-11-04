/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
import type { FeeAssetSchema } from './FeeAssetSchema';
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User is on the confirmation screen showing fees, total amount, and withdrawal time, and slides/clicks "Confirm" to complete the stablecoin withdrawal (powered by Changelly)
 *
 */
export type WithdrawSendConfirmSchema = {
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

