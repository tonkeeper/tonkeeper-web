/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User selected a network on the "Choose network" screen
 */
export type DepositClickNetworkSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Carried from deposit_click_stablecoin
     */
    buy_asset: string;
    /**
     * Carried from deposit_click_stablecoin_payment_method
     */
    stablecoin_symbol: string;
    /**
     * Full asset identifier now known with network, in chain/network/type format: eth/mainnet/token/{addr}, base/mainnet/token/{addr}
     *
     */
    sell_asset: string;
};

