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
 * @interface JettonTransferPayload
 */
export interface JettonTransferPayload {
    /**
     * hex-encoded BoC
     * @type {string}
     * @memberof JettonTransferPayload
     */
    customPayload?: string;
    /**
     * hex-encoded BoC
     * @type {string}
     * @memberof JettonTransferPayload
     */
    stateInit?: string;
}

/**
 * Check if a given object implements the JettonTransferPayload interface.
 */
export function instanceOfJettonTransferPayload(value: object): value is JettonTransferPayload {
    return true;
}

export function JettonTransferPayloadFromJSON(json: any): JettonTransferPayload {
    return JettonTransferPayloadFromJSONTyped(json, false);
}

export function JettonTransferPayloadFromJSONTyped(json: any, ignoreDiscriminator: boolean): JettonTransferPayload {
    if (json == null) {
        return json;
    }
    return {
        
        'customPayload': json['custom_payload'] == null ? undefined : json['custom_payload'],
        'stateInit': json['state_init'] == null ? undefined : json['state_init'],
    };
}

export function JettonTransferPayloadToJSON(json: any): JettonTransferPayload {
    return JettonTransferPayloadToJSONTyped(json, false);
}

export function JettonTransferPayloadToJSONTyped(value?: JettonTransferPayload | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'custom_payload': value['customPayload'],
        'state_init': value['stateInit'],
    };
}

