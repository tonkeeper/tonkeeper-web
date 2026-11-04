/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { AssetSchema } from './AssetSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User selected a network on the "Choose network" screen
 */
export type DepositClickNetworkSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    buy_asset: AssetSchema;
    /**
     * Carried from deposit_click_stablecoin_payment_method
     */
    stablecoin_symbol: string;
    sell_asset: AssetSchema;
};

