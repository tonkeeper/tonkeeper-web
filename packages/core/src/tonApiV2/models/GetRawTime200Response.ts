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
 * @interface GetRawTime200Response
 */
export interface GetRawTime200Response {
    /**
     * 
     * @type {number}
     * @memberof GetRawTime200Response
     */
    time: number;
}

/**
 * Check if a given object implements the GetRawTime200Response interface.
 */
export function instanceOfGetRawTime200Response(value: object): value is GetRawTime200Response {
    if (!('time' in value) || value['time'] === undefined) return false;
    return true;
}

export function GetRawTime200ResponseFromJSON(json: any): GetRawTime200Response {
    return GetRawTime200ResponseFromJSONTyped(json, false);
}

export function GetRawTime200ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetRawTime200Response {
    if (json == null) {
        return json;
    }
    return {
        
        'time': json['time'],
    };
}

  export function GetRawTime200ResponseToJSON(json: any): GetRawTime200Response {
      return GetRawTime200ResponseToJSONTyped(json, false);
  }

  export function GetRawTime200ResponseToJSONTyped(value?: GetRawTime200Response | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'time': value['time'],
    };
}

