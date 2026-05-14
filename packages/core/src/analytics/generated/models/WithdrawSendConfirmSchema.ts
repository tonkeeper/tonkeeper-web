/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeePaidInSchema } from './FeePaidInSchema';
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
     * Carried from withdraw_click_insert_amount_continue
     */
    amount: number;
    fee_paid_in: FeePaidInSchema;
};

