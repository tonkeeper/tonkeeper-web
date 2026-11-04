/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { AssetSchema } from './AssetSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User sees the "Choose network" screen listing available networks for the selected stablecoin (ERC20, SPL, POL, ARB, Base, etc.)
 *
 */
export type DepositViewChooseNetworkSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    buy_asset: AssetSchema;
    /**
     * Carried from deposit_click_stablecoin_payment_method
     */
    stablecoin_symbol: string;
    /**
     * Slugs of the options shown to the user on this screen. Use standard identifier slugs from the backend response.
     *
     */
    available_options: Array<string>;
};

