/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AndroidBatteryPurchaseStatus = {
    purchases: Array<{
        product_id: string;
        token: string;
        success: boolean;
        error?: {
            msg: string;
            code: 'invalid-product-id' | 'user-not-found' | 'purchase-is-already-used' | 'temporary-error' | 'unknown';
        };
    }>;
};

