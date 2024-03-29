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
 * @interface ReduceIndexingLatencyDefaultResponse
 */
export interface ReduceIndexingLatencyDefaultResponse {
    /**
     * 
     * @type {string}
     * @memberof ReduceIndexingLatencyDefaultResponse
     */
    error: string;
}

/**
 * Check if a given object implements the ReduceIndexingLatencyDefaultResponse interface.
 */
export function instanceOfReduceIndexingLatencyDefaultResponse(value: object): boolean {
    if (!('error' in value)) return false;
    return true;
}

export function ReduceIndexingLatencyDefaultResponseFromJSON(json: any): ReduceIndexingLatencyDefaultResponse {
    return ReduceIndexingLatencyDefaultResponseFromJSONTyped(json, false);
}

export function ReduceIndexingLatencyDefaultResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ReduceIndexingLatencyDefaultResponse {
    if (json == null) {
        return json;
    }
    return {
        
        'error': json['error'],
    };
}

export function ReduceIndexingLatencyDefaultResponseToJSON(value?: ReduceIndexingLatencyDefaultResponse | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'error': value['error'],
    };
}

