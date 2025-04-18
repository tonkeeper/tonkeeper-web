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
import type { BlockchainConfig18StoragePricesInner } from './BlockchainConfig18StoragePricesInner';
import {
    BlockchainConfig18StoragePricesInnerFromJSON,
    BlockchainConfig18StoragePricesInnerFromJSONTyped,
    BlockchainConfig18StoragePricesInnerToJSON,
    BlockchainConfig18StoragePricesInnerToJSONTyped,
} from './BlockchainConfig18StoragePricesInner';

/**
 * The prices for data storage.
 * @export
 * @interface BlockchainConfig18
 */
export interface BlockchainConfig18 {
    /**
     * 
     * @type {Array<BlockchainConfig18StoragePricesInner>}
     * @memberof BlockchainConfig18
     */
    storagePrices: Array<BlockchainConfig18StoragePricesInner>;
}

/**
 * Check if a given object implements the BlockchainConfig18 interface.
 */
export function instanceOfBlockchainConfig18(value: object): value is BlockchainConfig18 {
    if (!('storagePrices' in value) || value['storagePrices'] === undefined) return false;
    return true;
}

export function BlockchainConfig18FromJSON(json: any): BlockchainConfig18 {
    return BlockchainConfig18FromJSONTyped(json, false);
}

export function BlockchainConfig18FromJSONTyped(json: any, ignoreDiscriminator: boolean): BlockchainConfig18 {
    if (json == null) {
        return json;
    }
    return {
        
        'storagePrices': ((json['storage_prices'] as Array<any>).map(BlockchainConfig18StoragePricesInnerFromJSON)),
    };
}

export function BlockchainConfig18ToJSON(json: any): BlockchainConfig18 {
    return BlockchainConfig18ToJSONTyped(json, false);
}

export function BlockchainConfig18ToJSONTyped(value?: BlockchainConfig18 | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'storage_prices': ((value['storagePrices'] as Array<any>).map(BlockchainConfig18StoragePricesInnerToJSON)),
    };
}

