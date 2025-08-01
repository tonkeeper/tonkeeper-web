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
import type { NftItem } from './NftItem';
import {
    NftItemFromJSON,
    NftItemFromJSONTyped,
    NftItemToJSON,
    NftItemToJSONTyped,
} from './NftItem';
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
 * @interface NftOperation
 */
export interface NftOperation {
    /**
     * 
     * @type {string}
     * @memberof NftOperation
     */
    operation: string;
    /**
     * 
     * @type {number}
     * @memberof NftOperation
     */
    utime: number;
    /**
     * 
     * @type {number}
     * @memberof NftOperation
     */
    lt: number;
    /**
     * 
     * @type {string}
     * @memberof NftOperation
     */
    transactionHash: string;
    /**
     * 
     * @type {AccountAddress}
     * @memberof NftOperation
     */
    source?: AccountAddress;
    /**
     * 
     * @type {AccountAddress}
     * @memberof NftOperation
     */
    destination?: AccountAddress;
    /**
     * 
     * @type {NftItem}
     * @memberof NftOperation
     */
    item: NftItem;
}

/**
 * Check if a given object implements the NftOperation interface.
 */
export function instanceOfNftOperation(value: object): value is NftOperation {
    if (!('operation' in value) || value['operation'] === undefined) return false;
    if (!('utime' in value) || value['utime'] === undefined) return false;
    if (!('lt' in value) || value['lt'] === undefined) return false;
    if (!('transactionHash' in value) || value['transactionHash'] === undefined) return false;
    if (!('item' in value) || value['item'] === undefined) return false;
    return true;
}

export function NftOperationFromJSON(json: any): NftOperation {
    return NftOperationFromJSONTyped(json, false);
}

export function NftOperationFromJSONTyped(json: any, ignoreDiscriminator: boolean): NftOperation {
    if (json == null) {
        return json;
    }
    return {
        
        'operation': json['operation'],
        'utime': json['utime'],
        'lt': json['lt'],
        'transactionHash': json['transaction_hash'],
        'source': json['source'] == null ? undefined : AccountAddressFromJSON(json['source']),
        'destination': json['destination'] == null ? undefined : AccountAddressFromJSON(json['destination']),
        'item': NftItemFromJSON(json['item']),
    };
}

  export function NftOperationToJSON(json: any): NftOperation {
      return NftOperationToJSONTyped(json, false);
  }

  export function NftOperationToJSONTyped(value?: NftOperation | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'operation': value['operation'],
        'utime': value['utime'],
        'lt': value['lt'],
        'transaction_hash': value['transactionHash'],
        'source': AccountAddressToJSON(value['source']),
        'destination': AccountAddressToJSON(value['destination']),
        'item': NftItemToJSON(value['item']),
    };
}

