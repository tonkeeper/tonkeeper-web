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
 * @interface GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack
 */
export interface GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack {
    /**
     * 
     * @type {boolean}
     * @memberof GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack
     */
    toKeyBlock: boolean;
    /**
     * 
     * @type {BlockRaw}
     * @memberof GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack
     */
    from: BlockRaw;
    /**
     * 
     * @type {BlockRaw}
     * @memberof GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack
     */
    to: BlockRaw;
    /**
     * 
     * @type {string}
     * @memberof GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack
     */
    destProof: string;
    /**
     * 
     * @type {string}
     * @memberof GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack
     */
    proof: string;
    /**
     * 
     * @type {string}
     * @memberof GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack
     */
    stateProof: string;
}

/**
 * Check if a given object implements the GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack interface.
 */
export function instanceOfGetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack(value: object): value is GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack {
    if (!('toKeyBlock' in value) || value['toKeyBlock'] === undefined) return false;
    if (!('from' in value) || value['from'] === undefined) return false;
    if (!('to' in value) || value['to'] === undefined) return false;
    if (!('destProof' in value) || value['destProof'] === undefined) return false;
    if (!('proof' in value) || value['proof'] === undefined) return false;
    if (!('stateProof' in value) || value['stateProof'] === undefined) return false;
    return true;
}

export function GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBackFromJSON(json: any): GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack {
    return GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBackFromJSONTyped(json, false);
}

export function GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBackFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack {
    if (json == null) {
        return json;
    }
    return {
        
        'toKeyBlock': json['to_key_block'],
        'from': BlockRawFromJSON(json['from']),
        'to': BlockRawFromJSON(json['to']),
        'destProof': json['dest_proof'],
        'proof': json['proof'],
        'stateProof': json['state_proof'],
    };
}

export function GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBackToJSON(json: any): GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack {
    return GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBackToJSONTyped(json, false);
}

export function GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBackToJSONTyped(value?: GetRawBlockProof200ResponseStepsInnerLiteServerBlockLinkBack | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'to_key_block': value['toKeyBlock'],
        'from': BlockRawToJSON(value['from']),
        'to': BlockRawToJSON(value['to']),
        'dest_proof': value['destProof'],
        'proof': value['proof'],
        'state_proof': value['stateProof'],
    };
}

