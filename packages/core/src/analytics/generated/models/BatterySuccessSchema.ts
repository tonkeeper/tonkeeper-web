/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * User successfully completed a battery purchase
 */
export type BatterySuccessSchema = {
    eventName: string;
    /**
     * Entry point where user came from (same value as in battery_open event)
     */
    from: 'wallet' | 'settings' | 'tron_fees' | 'insufficient_funds' | 'deeplink' | 'send' | 'battery_banner';
    /**
     * Payment method used
     */
    type: 'crypto' | 'fiat';
    /**
     * Pack size purchased
     */
    size: 'custom' | 'small' | 'medium' | 'large';
    /**
     * Promo code applied (if any)
     */
    promo?: string | null;
    /**
     * Cryptocurrency used for payment (crypto only, e.g., 'TON', 'USD₮', 'HMSTR', 'DOGS', 'NOT')
     */
    jetton?: string | null;
};

