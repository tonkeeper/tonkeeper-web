/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User selected a stablecoin to pay with on the "Payment method" screen
 */
export type DepositClickStablecoinPaymentMethodSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Carried from deposit_click_stablecoin
     */
    buy_asset: string;
    /**
     * Symbol of the stablecoin the user will send (e.g. USDC, USDT, DAI). Network is not yet known at this step.
     *
     */
    stablecoin_symbol: string;
};

