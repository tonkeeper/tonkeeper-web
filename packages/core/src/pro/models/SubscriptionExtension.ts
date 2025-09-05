/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CryptoCurrency } from './CryptoCurrency';
import type { SubscriptionExtensionMetadata } from './SubscriptionExtensionMetadata';
import type { SubscriptionExtensionStatus } from './SubscriptionExtensionStatus';
export type SubscriptionExtension = {
    status: SubscriptionExtensionStatus;
    contract: string;
    admin: string;
    payer: string;
    recipient: string;
    currency: CryptoCurrency;
    subscription_id: number;
    payment_per_period: string;
    period: number;
    first_charging_date: number;
    caller_fee: string;
    grace_period: number;
    last_charging_date: number;
    created_at: number;
    withdraw_msg_body?: string;
    metadata: SubscriptionExtensionMetadata;
};

