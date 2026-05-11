/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User sees the external app alert modal (e.g. "Mercuryo — You are opening an external app not operated by Tonkeeper") before being sent to the onramp provider
 *
 */
export type DepositViewRampAlertSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Carried from deposit_click_asset
     */
    buy_asset: string;
    /**
     * Carried from deposit_view_fiat_payment_method
     */
    sell_asset: string;
    /**
     * Carried from deposit_click_fiat_payment_method
     */
    payment_method: string;
    /**
     * Carried from deposit_view_ramp_amount
     */
    provider_name: string;
    /**
     * Amount the user entered on the ramp amount screen
     */
    amount: number;
};

