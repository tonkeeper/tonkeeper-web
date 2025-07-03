/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubscriptionSource } from './SubscriptionSource';
export type SubscriptionVerification = {
    valid: boolean;
    is_trial: boolean;
    used_trial: boolean;
    next_charge?: number;
    auth_token: string;
    source: SubscriptionSource;
    ios?: {
        tx_id: string;
        original_tx_id: string;
        store_front: string;
        store_front_id: string;
        product_id: string;
        transaction_type: string;
        price: number;
        currency: string;
        purchase_date: number;
        expires_date: number;
    };
};

