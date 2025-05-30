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
/**
 * 
 * @export
 * @interface ReducedBlock
 */
export interface ReducedBlock {
    /**
     * 
     * @type {number}
     * @memberof ReducedBlock
     */
    workchainId: number;
    /**
     * 
     * @type {string}
     * @memberof ReducedBlock
     */
    shard: string;
    /**
     * 
     * @type {number}
     * @memberof ReducedBlock
     */
    seqno: number;
    /**
     * 
     * @type {string}
     * @memberof ReducedBlock
     */
    masterRef?: string;
    /**
     * 
     * @type {number}
     * @memberof ReducedBlock
     */
    txQuantity: number;
    /**
     * 
     * @type {number}
     * @memberof ReducedBlock
     */
    utime: number;
    /**
     * 
     * @type {Array<string>}
     * @memberof ReducedBlock
     */
    shardsBlocks: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof ReducedBlock
     */
    parent: Array<string>;
}

/**
 * Check if a given object implements the ReducedBlock interface.
 */
export function instanceOfReducedBlock(value: object): value is ReducedBlock {
    if (!('workchainId' in value) || value['workchainId'] === undefined) return false;
    if (!('shard' in value) || value['shard'] === undefined) return false;
    if (!('seqno' in value) || value['seqno'] === undefined) return false;
    if (!('txQuantity' in value) || value['txQuantity'] === undefined) return false;
    if (!('utime' in value) || value['utime'] === undefined) return false;
    if (!('shardsBlocks' in value) || value['shardsBlocks'] === undefined) return false;
    if (!('parent' in value) || value['parent'] === undefined) return false;
    return true;
}

export function ReducedBlockFromJSON(json: any): ReducedBlock {
    return ReducedBlockFromJSONTyped(json, false);
}

export function ReducedBlockFromJSONTyped(json: any, ignoreDiscriminator: boolean): ReducedBlock {
    if (json == null) {
        return json;
    }
    return {
        
        'workchainId': json['workchain_id'],
        'shard': json['shard'],
        'seqno': json['seqno'],
        'masterRef': json['master_ref'] == null ? undefined : json['master_ref'],
        'txQuantity': json['tx_quantity'],
        'utime': json['utime'],
        'shardsBlocks': json['shards_blocks'],
        'parent': json['parent'],
    };
}

export function ReducedBlockToJSON(json: any): ReducedBlock {
    return ReducedBlockToJSONTyped(json, false);
}

export function ReducedBlockToJSONTyped(value?: ReducedBlock | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'workchain_id': value['workchainId'],
        'shard': value['shard'],
        'seqno': value['seqno'],
        'master_ref': value['masterRef'],
        'tx_quantity': value['txQuantity'],
        'utime': value['utime'],
        'shards_blocks': value['shardsBlocks'],
        'parent': value['parent'],
    };
}

