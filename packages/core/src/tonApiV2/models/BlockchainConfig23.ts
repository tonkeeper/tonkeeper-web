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
import type { BlockLimits } from './BlockLimits';
import {
    BlockLimitsFromJSON,
    BlockLimitsFromJSONTyped,
    BlockLimitsToJSON,
    BlockLimitsToJSONTyped,
} from './BlockLimits';

/**
 * The limits on the block in the basechains, upon reaching which the block is finalized and the callback of the remaining messages (if any) is carried over to the next block.
 * @export
 * @interface BlockchainConfig23
 */
export interface BlockchainConfig23 {
    /**
     * 
     * @type {BlockLimits}
     * @memberof BlockchainConfig23
     */
    blockLimits: BlockLimits;
}

/**
 * Check if a given object implements the BlockchainConfig23 interface.
 */
export function instanceOfBlockchainConfig23(value: object): value is BlockchainConfig23 {
    if (!('blockLimits' in value) || value['blockLimits'] === undefined) return false;
    return true;
}

export function BlockchainConfig23FromJSON(json: any): BlockchainConfig23 {
    return BlockchainConfig23FromJSONTyped(json, false);
}

export function BlockchainConfig23FromJSONTyped(json: any, ignoreDiscriminator: boolean): BlockchainConfig23 {
    if (json == null) {
        return json;
    }
    return {
        
        'blockLimits': BlockLimitsFromJSON(json['block_limits']),
    };
}

export function BlockchainConfig23ToJSON(json: any): BlockchainConfig23 {
    return BlockchainConfig23ToJSONTyped(json, false);
}

export function BlockchainConfig23ToJSONTyped(value?: BlockchainConfig23 | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'block_limits': BlockLimitsToJSON(value['blockLimits']),
    };
}

