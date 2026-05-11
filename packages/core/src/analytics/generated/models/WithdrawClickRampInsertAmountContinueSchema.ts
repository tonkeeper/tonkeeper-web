/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User tapped "Continue" on the ramp insert amount screen
 */
export type WithdrawClickRampInsertAmountContinueSchema = {
    eventName: string;
    from: RampSourceSchema;
    withdraw_option: WithdrawOptionSchema;
    /**
     * Carried from withdraw_click_fiat_asset
     */
    sell_asset: string;
    /**
     * Carried from withdraw_view_fiat_payment_method
     */
    buy_asset: string;
    /**
     * Carried from withdraw_click_fiat_payment_method
     */
    payment_method: string;
    /**
     * Carried from withdraw_view_ramp_insert_amount
     */
    provider_name: string;
    /**
     * Amount the user entered
     */
    amount: number;
};

