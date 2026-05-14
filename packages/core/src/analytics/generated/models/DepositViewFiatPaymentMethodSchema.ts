/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AddFundsOptionSchema } from './AddFundsOptionSchema';
import type { RampSourceSchema } from './RampSourceSchema';
/**
 * User sees the "Payment method" screen listing fiat payment options (Apple Pay, Debit Card, PayPal, Revolut Pay, Venmo, Volt, P2P Market)
 *
 */
export type DepositViewFiatPaymentMethodSchema = {
    eventName: string;
    from: RampSourceSchema;
    add_funds_option: AddFundsOptionSchema;
    /**
     * Carried from deposit_click_asset
     */
    buy_asset: string;
    /**
     * Fiat currency the user is paying with (ISO code, e.g. USD, EUR)
     *
     */
    sell_asset: string;
    /**
     * Slugs of the options shown to the user on this screen. Use standard identifier slugs from the backend response.
     *
     */
    available_options: Array<string>;
};

