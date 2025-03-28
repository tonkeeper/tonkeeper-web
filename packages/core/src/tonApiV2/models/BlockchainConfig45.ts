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
import type { BlockchainConfig45ContractsInner } from './BlockchainConfig45ContractsInner';
import {
    BlockchainConfig45ContractsInnerFromJSON,
    BlockchainConfig45ContractsInnerFromJSONTyped,
    BlockchainConfig45ContractsInnerToJSON,
    BlockchainConfig45ContractsInnerToJSONTyped,
} from './BlockchainConfig45ContractsInner';

/**
 * precompiled contracts
 * @export
 * @interface BlockchainConfig45
 */
export interface BlockchainConfig45 {
    /**
     * 
     * @type {Array<BlockchainConfig45ContractsInner>}
     * @memberof BlockchainConfig45
     */
    contracts: Array<BlockchainConfig45ContractsInner>;
}

/**
 * Check if a given object implements the BlockchainConfig45 interface.
 */
export function instanceOfBlockchainConfig45(value: object): value is BlockchainConfig45 {
    if (!('contracts' in value) || value['contracts'] === undefined) return false;
    return true;
}

export function BlockchainConfig45FromJSON(json: any): BlockchainConfig45 {
    return BlockchainConfig45FromJSONTyped(json, false);
}

export function BlockchainConfig45FromJSONTyped(json: any, ignoreDiscriminator: boolean): BlockchainConfig45 {
    if (json == null) {
        return json;
    }
    return {
        
        'contracts': ((json['contracts'] as Array<any>).map(BlockchainConfig45ContractsInnerFromJSON)),
    };
}

export function BlockchainConfig45ToJSON(json: any): BlockchainConfig45 {
    return BlockchainConfig45ToJSONTyped(json, false);
}

export function BlockchainConfig45ToJSONTyped(value?: BlockchainConfig45 | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'contracts': ((value['contracts'] as Array<any>).map(BlockchainConfig45ContractsInnerToJSON)),
    };
}

