/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User sees the "Choose network" screen listing available networks for the selected stablecoin (Ethereum ERC20, Solana SPL, Polygon POL, Arbitrum ARB, Base, etc.)
 *
 */
export type WithdrawViewChooseNetworkSchema = {
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
     * Slugs of the options shown to the user on this screen. Use standard identifier slugs from the backend response.
     *
     */
    available_options: Array<string>;
};

