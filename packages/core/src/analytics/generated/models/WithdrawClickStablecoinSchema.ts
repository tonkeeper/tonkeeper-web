/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User selected a stablecoin to receive on the "Asset to receive" screen
 */
export type WithdrawClickStablecoinSchema = {
    eventName: string;
    from: RampSourceSchema;
    withdraw_option: WithdrawOptionSchema;
    /**
     * Carried from withdraw_click_asset
     */
    sell_asset: string;
    /**
     * Symbol of the stablecoin the user will receive (e.g. USDC, USDT, DAI). Network is not yet known at this step.
     *
     */
    stablecoin_symbol: string;
};

