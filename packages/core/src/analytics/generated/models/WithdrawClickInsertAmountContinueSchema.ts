/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User tapped "Continue" on the amount/address screen
 */
export type WithdrawClickInsertAmountContinueSchema = {
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
     * Amount the user entered to withdraw
     */
    amount: number;
};

