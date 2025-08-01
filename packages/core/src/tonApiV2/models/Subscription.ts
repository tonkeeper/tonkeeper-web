/* tslint:disable */
/* eslint-disable */
/**
 * REST api to TON blockchain explorer
 * Provide access to indexed TON blockchain
 *
 * The version of the OpenAPI document: 2.0.0
 * Contact: support@tonkeeper.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
import type { Price } from './Price';
import {
    PriceFromJSON,
    PriceFromJSONTyped,
    PriceToJSON,
    PriceToJSONTyped,
} from './Price';
import type { Metadata } from './Metadata';
import {
    MetadataFromJSON,
    MetadataFromJSONTyped,
    MetadataToJSON,
    MetadataToJSONTyped,
} from './Metadata';
import type { AccountAddress } from './AccountAddress';
import {
    AccountAddressFromJSON,
    AccountAddressFromJSONTyped,
    AccountAddressToJSON,
    AccountAddressToJSONTyped,
} from './AccountAddress';

/**
 * 
 * @export
 * @interface Subscription
 */
export interface Subscription {
    /**
     * type of subscription
     * @type {string}
     * @memberof Subscription
     */
    type: string;
    /**
     * 
     * @type {string}
     * @memberof Subscription
     */
    status: SubscriptionStatusEnum;
    /**
     * payment period in seconds
     * @type {number}
     * @memberof Subscription
     */
    period: number;
    /**
     * common identifier
     * @type {string}
     * @memberof Subscription
     */
    subscriptionId: string;
    /**
     * 
     * @type {Price}
     * @memberof Subscription
     */
    paymentPerPeriod: Price;
    /**
     * 
     * @type {AccountAddress}
     * @memberof Subscription
     */
    wallet: AccountAddress;
    /**
     * 
     * @type {number}
     * @memberof Subscription
     */
    nextChargeAt: number;
    /**
     * 
     * @type {Metadata}
     * @memberof Subscription
     */
    metadata: Metadata;
    /**
     * 
     * @type {string}
     * @memberof Subscription
     */
    address?: string;
    /**
     * 
     * @type {AccountAddress}
     * @memberof Subscription
     */
    beneficiary?: AccountAddress;
}


/**
 * @export
 */
export const SubscriptionStatusEnum = {
    NotReady: 'not_ready',
    Active: 'active',
    Suspended: 'suspended',
    Cancelled: 'cancelled'
} as const;
export type SubscriptionStatusEnum = typeof SubscriptionStatusEnum[keyof typeof SubscriptionStatusEnum];


/**
 * Check if a given object implements the Subscription interface.
 */
export function instanceOfSubscription(value: object): value is Subscription {
    if (!('type' in value) || value['type'] === undefined) return false;
    if (!('status' in value) || value['status'] === undefined) return false;
    if (!('period' in value) || value['period'] === undefined) return false;
    if (!('subscriptionId' in value) || value['subscriptionId'] === undefined) return false;
    if (!('paymentPerPeriod' in value) || value['paymentPerPeriod'] === undefined) return false;
    if (!('wallet' in value) || value['wallet'] === undefined) return false;
    if (!('nextChargeAt' in value) || value['nextChargeAt'] === undefined) return false;
    if (!('metadata' in value) || value['metadata'] === undefined) return false;
    return true;
}

export function SubscriptionFromJSON(json: any): Subscription {
    return SubscriptionFromJSONTyped(json, false);
}

export function SubscriptionFromJSONTyped(json: any, ignoreDiscriminator: boolean): Subscription {
    if (json == null) {
        return json;
    }
    return {
        
        'type': json['type'],
        'status': json['status'],
        'period': json['period'],
        'subscriptionId': json['subscription_id'],
        'paymentPerPeriod': PriceFromJSON(json['payment_per_period']),
        'wallet': AccountAddressFromJSON(json['wallet']),
        'nextChargeAt': json['next_charge_at'],
        'metadata': MetadataFromJSON(json['metadata']),
        'address': json['address'] == null ? undefined : json['address'],
        'beneficiary': json['beneficiary'] == null ? undefined : AccountAddressFromJSON(json['beneficiary']),
    };
}

  export function SubscriptionToJSON(json: any): Subscription {
      return SubscriptionToJSONTyped(json, false);
  }

  export function SubscriptionToJSONTyped(value?: Subscription | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'type': value['type'],
        'status': value['status'],
        'period': value['period'],
        'subscription_id': value['subscriptionId'],
        'payment_per_period': PriceToJSON(value['paymentPerPeriod']),
        'wallet': AccountAddressToJSON(value['wallet']),
        'next_charge_at': value['nextChargeAt'],
        'metadata': MetadataToJSON(value['metadata']),
        'address': value['address'],
        'beneficiary': AccountAddressToJSON(value['beneficiary']),
    };
}

