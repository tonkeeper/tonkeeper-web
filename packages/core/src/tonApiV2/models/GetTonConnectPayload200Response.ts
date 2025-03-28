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
 * @interface GetTonConnectPayload200Response
 */
export interface GetTonConnectPayload200Response {
    /**
     * 
     * @type {string}
     * @memberof GetTonConnectPayload200Response
     */
    payload: string;
}

/**
 * Check if a given object implements the GetTonConnectPayload200Response interface.
 */
export function instanceOfGetTonConnectPayload200Response(value: object): value is GetTonConnectPayload200Response {
    if (!('payload' in value) || value['payload'] === undefined) return false;
    return true;
}

export function GetTonConnectPayload200ResponseFromJSON(json: any): GetTonConnectPayload200Response {
    return GetTonConnectPayload200ResponseFromJSONTyped(json, false);
}

export function GetTonConnectPayload200ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetTonConnectPayload200Response {
    if (json == null) {
        return json;
    }
    return {
        
        'payload': json['payload'],
    };
}

export function GetTonConnectPayload200ResponseToJSON(json: any): GetTonConnectPayload200Response {
    return GetTonConnectPayload200ResponseToJSONTyped(json, false);
}

export function GetTonConnectPayload200ResponseToJSONTyped(value?: GetTonConnectPayload200Response | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'payload': value['payload'],
    };
}

