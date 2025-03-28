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
 * @interface TonConnectProof200Response
 */
export interface TonConnectProof200Response {
    /**
     * 
     * @type {string}
     * @memberof TonConnectProof200Response
     */
    token: string;
}

/**
 * Check if a given object implements the TonConnectProof200Response interface.
 */
export function instanceOfTonConnectProof200Response(value: object): value is TonConnectProof200Response {
    if (!('token' in value) || value['token'] === undefined) return false;
    return true;
}

export function TonConnectProof200ResponseFromJSON(json: any): TonConnectProof200Response {
    return TonConnectProof200ResponseFromJSONTyped(json, false);
}

export function TonConnectProof200ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): TonConnectProof200Response {
    if (json == null) {
        return json;
    }
    return {
        
        'token': json['token'],
    };
}

export function TonConnectProof200ResponseToJSON(json: any): TonConnectProof200Response {
    return TonConnectProof200ResponseToJSONTyped(json, false);
}

export function TonConnectProof200ResponseToJSONTyped(value?: TonConnectProof200Response | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'token': value['token'],
    };
}

