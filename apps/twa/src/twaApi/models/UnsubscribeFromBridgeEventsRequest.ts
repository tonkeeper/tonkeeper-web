/* tslint:disable */
/* eslint-disable */
/**
 * Tonkeeper TWA API.
 * REST API for Tonkeeper TWA.
 *
 * The version of the OpenAPI document: 0.0.1
 * Contact: support@tonkeeper.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface UnsubscribeFromBridgeEventsRequest
 */
export interface UnsubscribeFromBridgeEventsRequest {
    /**
     * Base64 encoded twa init data
     * @type {string}
     * @memberof UnsubscribeFromBridgeEventsRequest
     */
    twaInitData: string;
    /**
     * 
     * @type {string}
     * @memberof UnsubscribeFromBridgeEventsRequest
     */
    clientId?: string;
}

/**
 * Check if a given object implements the UnsubscribeFromBridgeEventsRequest interface.
 */
export function instanceOfUnsubscribeFromBridgeEventsRequest(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "twaInitData" in value;

    return isInstance;
}

export function UnsubscribeFromBridgeEventsRequestFromJSON(json: any): UnsubscribeFromBridgeEventsRequest {
    return UnsubscribeFromBridgeEventsRequestFromJSONTyped(json, false);
}

export function UnsubscribeFromBridgeEventsRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): UnsubscribeFromBridgeEventsRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'twaInitData': json['twa_init_data'],
        'clientId': !exists(json, 'client_id') ? undefined : json['client_id'],
    };
}

export function UnsubscribeFromBridgeEventsRequestToJSON(value?: UnsubscribeFromBridgeEventsRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'twa_init_data': value.twaInitData,
        'client_id': value.clientId,
    };
}

