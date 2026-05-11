/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User selected a network on the "Choose network" screen
 */
export type WithdrawClickNetworkSchema = {
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
     * Full asset identifier now known with network, in chain/network/type format: eth/mainnet/token/{addr}, base/mainnet/token/{addr}
     *
     */
    buy_asset: string;
};

