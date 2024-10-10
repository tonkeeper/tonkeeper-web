/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type iOSBatteryPurchaseStatus = {
    transactions: Array<{
        transaction_id: string;
        success: boolean;
        error?: {
            msg: string;
            code: 'invalid-bundle-id' | 'invalid-product-id' | 'user-not-found' | 'purchase-is-already-used' | 'temporary-error' | 'unknown';
        };
    }>;
};

