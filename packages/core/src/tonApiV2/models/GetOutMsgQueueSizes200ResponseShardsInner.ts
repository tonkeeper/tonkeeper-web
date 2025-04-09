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
 * @interface GetOutMsgQueueSizes200ResponseShardsInner
 */
export interface GetOutMsgQueueSizes200ResponseShardsInner {
    /**
     * 
     * @type {BlockRaw}
     * @memberof GetOutMsgQueueSizes200ResponseShardsInner
     */
    id: BlockRaw;
    /**
     * 
     * @type {number}
     * @memberof GetOutMsgQueueSizes200ResponseShardsInner
     */
    size: number;
}

/**
 * Check if a given object implements the GetOutMsgQueueSizes200ResponseShardsInner interface.
 */
export function instanceOfGetOutMsgQueueSizes200ResponseShardsInner(value: object): value is GetOutMsgQueueSizes200ResponseShardsInner {
    if (!('id' in value) || value['id'] === undefined) return false;
    if (!('size' in value) || value['size'] === undefined) return false;
    return true;
}

export function GetOutMsgQueueSizes200ResponseShardsInnerFromJSON(json: any): GetOutMsgQueueSizes200ResponseShardsInner {
    return GetOutMsgQueueSizes200ResponseShardsInnerFromJSONTyped(json, false);
}

export function GetOutMsgQueueSizes200ResponseShardsInnerFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetOutMsgQueueSizes200ResponseShardsInner {
    if (json == null) {
        return json;
    }
    return {
        
        'id': BlockRawFromJSON(json['id']),
        'size': json['size'],
    };
}

export function GetOutMsgQueueSizes200ResponseShardsInnerToJSON(json: any): GetOutMsgQueueSizes200ResponseShardsInner {
    return GetOutMsgQueueSizes200ResponseShardsInnerToJSONTyped(json, false);
}

export function GetOutMsgQueueSizes200ResponseShardsInnerToJSONTyped(value?: GetOutMsgQueueSizes200ResponseShardsInner | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': BlockRawToJSON(value['id']),
        'size': value['size'],
    };
}

