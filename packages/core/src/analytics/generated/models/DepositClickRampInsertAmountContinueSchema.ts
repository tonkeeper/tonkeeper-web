/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User tapped "Continue" on the ramp insert amount screen
 */
export type DepositClickRampInsertAmountContinueSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Carried from deposit_click_asset
     */
    buy_asset: string;
    /**
     * Carried from deposit_view_fiat_payment_method
     */
    sell_asset: string;
    /**
     * Carried from deposit_click_fiat_payment_method
     */
    payment_method: string;
    /**
     * Carried from deposit_view_ramp_insert_amount
     */
    provider_name: string;
    /**
     * Amount the user entered
     */
    amount: number;
};

