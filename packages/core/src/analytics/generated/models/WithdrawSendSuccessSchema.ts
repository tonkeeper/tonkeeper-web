/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FeePaidInSchema } from './FeePaidInSchema';
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * Stablecoin withdrawal transaction completed successfully
 */
export type WithdrawSendSuccessSchema = {
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

