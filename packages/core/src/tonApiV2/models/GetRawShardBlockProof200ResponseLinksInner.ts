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
import type { BlockRaw } from './BlockRaw';
import {
    BlockRawFromJSON,
    BlockRawFromJSONTyped,
    BlockRawToJSON,
    BlockRawToJSONTyped,
} from './BlockRaw';

/**
 * 
 * @export
 * @interface GetRawShardBlockProof200ResponseLinksInner
 */
export interface GetRawShardBlockProof200ResponseLinksInner {
    /**
     * 
     * @type {BlockRaw}
     * @memberof GetRawShardBlockProof200ResponseLinksInner
     */
    id: BlockRaw;
    /**
     * 
     * @type {string}
     * @memberof GetRawShardBlockProof200ResponseLinksInner
     */
    proof: string;
}

/**
 * Check if a given object implements the GetRawShardBlockProof200ResponseLinksInner interface.
 */
export function instanceOfGetRawShardBlockProof200ResponseLinksInner(value: object): value is GetRawShardBlockProof200ResponseLinksInner {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('proof' in value) || value['proof'] === undefined) return false;
    return true;
}

export function GetRawShardBlockProof200ResponseLinksInnerFromJSON(json: any): GetRawShardBlockProof200ResponseLinksInner {
    return GetRawShardBlockProof200ResponseLinksInnerFromJSONTyped(json, false);
}

export function GetRawShardBlockProof200ResponseLinksInnerFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetRawShardBlockProof200ResponseLinksInner {
    if (json == null) {
        return json;
    }
    return {
        
        'id': BlockRawFromJSON(json['id']),
        'proof': json['proof'],
    };
}

export function GetRawShardBlockProof200ResponseLinksInnerToJSON(json: any): GetRawShardBlockProof200ResponseLinksInner {
    return GetRawShardBlockProof200ResponseLinksInnerToJSONTyped(json, false);
}

export function GetRawShardBlockProof200ResponseLinksInnerToJSONTyped(value?: GetRawShardBlockProof200ResponseLinksInner | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': BlockRawToJSON(value['id']),
        'proof': value['proof'],
    };
}

