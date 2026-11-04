/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AssetSchema } from './AssetSchema';
import type { RampSourceSchema } from './RampSourceSchema';
import type { WithdrawOptionSchema } from './WithdrawOptionSchema';
/**
 * User selected a payment method on the "Payment method" screen
 */
export type WithdrawClickFiatPaymentMethodSchema = {
    eventName: string;
    from: RampSourceSchema;
    withdraw_option: WithdrawOptionSchema;
    sell_asset: AssetSchema;
    /**
     * Carried from withdraw_view_fiat_payment_method
     */
    buy_asset: string;
    /**
     * Payment method the user selected (e.g. sepa, paypal, debit_card)
     */
    payment_method: string;
};

