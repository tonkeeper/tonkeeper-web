/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User tapped "Continue" on the amount/address screen
 */
export type WithdrawClickInsertAmountContinueSchema = {
    eventName: string;
    from: RampSourceSchema;
    withdraw_option: WithdrawOptionSchema;
    /**
     * Carried from withdraw_click_asset
     */
    sell_asset: string;
    /**
     * Carried from withdraw_click_stablecoin
     */
    stablecoin_symbol: string;
    /**
     * Carried from withdraw_click_network
     */
    buy_asset: string;
    /**
     * Amount the user entered to withdraw
     */
    amount: number;
};

