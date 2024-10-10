/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type promoCodeBatteryPurchaseStatus = {
    balance_change: string;
    success: boolean;
    error?: {
        msg: string;
        code: promoCodeBatteryPurchaseStatus.code;
    };
};
export namespace promoCodeBatteryPurchaseStatus {
    export enum code {
        PROMO_CODE_NOT_FOUND = 'promo-code-not-found',
        PROMO_EXCEEDED_ATTEMPTS = 'promo-exceeded-attempts',
        TEMPORARY_ERROR = 'temporary-error',
    }
}

