/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CryptoCurrency } from './CryptoCurrency';
import type { SubscriptionExtensionMetadata } from './SubscriptionExtensionMetadata';
import type { SubscriptionExtensionStatus } from './SubscriptionExtensionStatus';
import type { SubscriptionExtensionVersion } from './SubscriptionExtensionVersion';
export type SubscriptionExtension = {
    version: SubscriptionExtensionVersion;
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
    /**
     * shows the subscription end date if the subscription is canceled
     */
    expiration_date?: number;
    created_at: number;
    withdraw_msg_body?: string;
    metadata?: SubscriptionExtensionMetadata;
    /**
     * the amount of TON that needs to be attached to the message when deploying the subscription
     */
    deploy_value: string;
    /**
     * the amount of TON that needs to be attached to the message when destroying the subscription
     */
    destroy_value: string;
};

