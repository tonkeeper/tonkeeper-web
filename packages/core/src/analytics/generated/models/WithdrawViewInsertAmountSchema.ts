/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User sees the "Receive [stablecoin] [network]" screen where they enter the destination address and amount to withdraw
 *
 */
export type WithdrawViewInsertAmountSchema = {
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
};

