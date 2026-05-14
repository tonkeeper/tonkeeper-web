/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User selected a payment method on the "Payment method" screen
 */
export type DepositClickFiatPaymentMethodSchema = {
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
     * Payment method the user selected (e.g. apple_pay, debit_card, paypal, p2p_market)
     */
    payment_method: string;
};

