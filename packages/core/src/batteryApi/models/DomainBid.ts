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
 * @interface DomainBid
 */
export interface DomainBid {
    /**
     * 
     * @type {boolean}
     * @memberof DomainBid
     */
    success: boolean;
    /**
     * 
     * @type {number}
     * @memberof DomainBid
     */
    value: number;
    /**
     * 
     * @type {number}
     * @memberof DomainBid
     */
    txTime: number;
    /**
     * 
     * @type {string}
     * @memberof DomainBid
     */
    txHash: string;
    /**
     * 
     * @type {AccountAddress}
     * @memberof DomainBid
     */
    bidder: AccountAddress;
}

/**
 * Check if a given object implements the DomainBid interface.
 */
export function instanceOfDomainBid(value: object): value is DomainBid {
    if (!('success' in value) || value['success'] === undefined) return false;
    if (!('value' in value) || value['value'] === undefined) return false;
    if (!('txTime' in value) || value['txTime'] === undefined) return false;
    if (!('txHash' in value) || value['txHash'] === undefined) return false;
    if (!('bidder' in value) || value['bidder'] === undefined) return false;
    return true;
}

export function DomainBidFromJSON(json: any): DomainBid {
    return DomainBidFromJSONTyped(json, false);
}

export function DomainBidFromJSONTyped(json: any, ignoreDiscriminator: boolean): DomainBid {
    if (json == null) {
        return json;
    }
    return {
        
        'success': json['success'],
        'value': json['value'],
        'txTime': json['txTime'],
        'txHash': json['txHash'],
        'bidder': AccountAddressFromJSON(json['bidder']),
    };
}

  export function DomainBidToJSON(json: any): DomainBid {
      return DomainBidToJSONTyped(json, false);
  }

  export function DomainBidToJSONTyped(value?: DomainBid | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'success': value['success'],
        'value': value['value'],
        'txTime': value['txTime'],
        'txHash': value['txHash'],
        'bidder': AccountAddressToJSON(value['bidder']),
    };
}
