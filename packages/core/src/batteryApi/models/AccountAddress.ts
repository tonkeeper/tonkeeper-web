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
/**
 * 
 * @export
 * @interface AccountAddress
 */
export interface AccountAddress {
    /**
     * 
     * @type {string}
     * @memberof AccountAddress
     */
    address: string;
    /**
     * Display name. Data collected from different sources like moderation lists, dns, collections names and over.
     * @type {string}
     * @memberof AccountAddress
     */
    name?: string;
    /**
     * Is this account was marked as part of scammers activity
     * @type {boolean}
     * @memberof AccountAddress
     */
    isScam: boolean;
    /**
     * 
     * @type {string}
     * @memberof AccountAddress
     */
    icon?: string;
    /**
     * 
     * @type {boolean}
     * @memberof AccountAddress
     */
    isWallet: boolean;
}

/**
 * Check if a given object implements the AccountAddress interface.
 */
export function instanceOfAccountAddress(value: object): value is AccountAddress {
    if (!('address' in value) || value['address'] === undefined) return false;
    if (!('isScam' in value) || value['isScam'] === undefined) return false;
    if (!('isWallet' in value) || value['isWallet'] === undefined) return false;
    return true;
}

export function AccountAddressFromJSON(json: any): AccountAddress {
    return AccountAddressFromJSONTyped(json, false);
}

export function AccountAddressFromJSONTyped(json: any, ignoreDiscriminator: boolean): AccountAddress {
    if (json == null) {
        return json;
    }
    return {
        
        'address': json['address'],
        'name': json['name'] == null ? undefined : json['name'],
        'isScam': json['is_scam'],
        'icon': json['icon'] == null ? undefined : json['icon'],
        'isWallet': json['is_wallet'],
    };
}

  export function AccountAddressToJSON(json: any): AccountAddress {
      return AccountAddressToJSONTyped(json, false);
  }

  export function AccountAddressToJSONTyped(value?: AccountAddress | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'address': value['address'],
        'name': value['name'],
        'is_scam': value['isScam'],
        'icon': value['icon'],
        'is_wallet': value['isWallet'],
    };
}

