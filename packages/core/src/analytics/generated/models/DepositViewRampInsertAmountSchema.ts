/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User sees the amount entry screen for the onramp purchase
 */
export type DepositViewRampInsertAmountSchema = {
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
     * Name of the onramp provider
     */
    provider_name: string;
};

