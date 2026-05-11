/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User sees the "Payment method" screen listing fiat payout options (SEPA, PayPal, Debit Card, etc.)
 *
 */
export type WithdrawViewFiatPaymentMethodSchema = {
    eventName: string;
    from: RampSourceSchema;
    withdraw_option: WithdrawOptionSchema;
    /**
     * Carried from withdraw_click_fiat_asset
     */
    sell_asset: string;
    /**
     * Fiat currency the user will receive (ISO code, e.g. USD, EUR)
     *
     */
    buy_asset: string;
    /**
     * Slugs of the options shown to the user on this screen. Use standard identifier slugs from the backend response.
     *
     */
    available_options: Array<string>;
};

