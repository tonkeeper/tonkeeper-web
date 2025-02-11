/* tslint:disable */
/* eslint-disable */
/**
 * Custodial-Battery REST API.
 * REST API for Custodial Battery which provides gas to different networks to help execute transactions.
 *
 * The version of the OpenAPI document: 0.0.1
 * Contact: support@tonkeeper.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
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
 * @interface SubscriptionAction
 */
export interface SubscriptionAction {
    /**
     * 
     * @type {AccountAddress}
     * @memberof SubscriptionAction
     */
    subscriber: AccountAddress;
    /**
     * 
     * @type {string}
     * @memberof SubscriptionAction
     */
    subscription: string;
    /**
     * 
     * @type {AccountAddress}
     * @memberof SubscriptionAction
     */
    beneficiary: AccountAddress;
    /**
     * 
     * @type {number}
     * @memberof SubscriptionAction
     */
    amount: number;
    /**
     * 
     * @type {boolean}
     * @memberof SubscriptionAction
     */
    initial: boolean;
}

/**
 * Check if a given object implements the SubscriptionAction interface.
 */
export function instanceOfSubscriptionAction(value: object): value is SubscriptionAction {
    if (!('subscriber' in value) || value['subscriber'] === undefined) return false;
    if (!('subscription' in value) || value['subscription'] === undefined) return false;
    if (!('beneficiary' in value) || value['beneficiary'] === undefined) return false;
    if (!('amount' in value) || value['amount'] === undefined) return false;
    if (!('initial' in value) || value['initial'] === undefined) return false;
    return true;
}

export function SubscriptionActionFromJSON(json: any): SubscriptionAction {
    return SubscriptionActionFromJSONTyped(json, false);
}

export function SubscriptionActionFromJSONTyped(json: any, ignoreDiscriminator: boolean): SubscriptionAction {
    if (json == null) {
        return json;
    }
    return {
        
        'subscriber': AccountAddressFromJSON(json['subscriber']),
        'subscription': json['subscription'],
        'beneficiary': AccountAddressFromJSON(json['beneficiary']),
        'amount': json['amount'],
        'initial': json['initial'],
    };
}

  export function SubscriptionActionToJSON(json: any): SubscriptionAction {
      return SubscriptionActionToJSONTyped(json, false);
  }

  export function SubscriptionActionToJSONTyped(value?: SubscriptionAction | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'subscriber': AccountAddressToJSON(value['subscriber']),
        'subscription': value['subscription'],
        'beneficiary': AccountAddressToJSON(value['beneficiary']),
        'amount': value['amount'],
        'initial': value['initial'],
    };
}

