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
 * @interface Seqno
 */
export interface Seqno {
    /**
     * 
     * @type {number}
     * @memberof Seqno
     */
    seqno: number;
}

/**
 * Check if a given object implements the Seqno interface.
 */
export function instanceOfSeqno(value: object): value is Seqno {
    if (!('seqno' in value) || value['seqno'] === undefined) return false;
    return true;
}

export function SeqnoFromJSON(json: any): Seqno {
    return SeqnoFromJSONTyped(json, false);
}

export function SeqnoFromJSONTyped(json: any, ignoreDiscriminator: boolean): Seqno {
    if (json == null) {
        return json;
    }
    return {
        
        'seqno': json['seqno'],
    };
}

export function SeqnoToJSON(json: any): Seqno {
    return SeqnoToJSONTyped(json, false);
}

export function SeqnoToJSONTyped(value?: Seqno | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'seqno': value['seqno'],
    };
}

