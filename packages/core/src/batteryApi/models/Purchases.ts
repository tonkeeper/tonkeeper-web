/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type Purchases = {
    total_purchases: number;
    purchases: Array<{
        promo?: string;
        for_account_id?: string;
        /**
         * @deprecated
         */
        user_purchase_id: number;
        purchase_id: number;
        type: 'android' | 'ios' | 'promo-code' | 'crypto' | 'gift' | 'on-the-way-gift';
        /**
         * Amount describes the amount paid by the user for this purchase when we know it. For crypto purchases it is always set.
         */
        amount?: string;
        charges: number;
        /**
         * Currency is set when we know it. For crypto purchases it is always set.
         */
        currency?: string;
        datetime: string;
        refund_information?: {
            fully_refunded: boolean;
            partially_refunded: boolean;
            pending_refund: boolean;
            refunded?: {
                amount: string;
                charges: number;
            };
            refundable?: {
                amount: string;
                charges: number;
            };
        };
    }>;
};

