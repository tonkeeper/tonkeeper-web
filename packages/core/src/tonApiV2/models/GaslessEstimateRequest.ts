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
import type { GaslessEstimateRequestMessagesInner } from './GaslessEstimateRequestMessagesInner';
import {
    GaslessEstimateRequestMessagesInnerFromJSON,
    GaslessEstimateRequestMessagesInnerFromJSONTyped,
    GaslessEstimateRequestMessagesInnerToJSON,
    GaslessEstimateRequestMessagesInnerToJSONTyped,
} from './GaslessEstimateRequestMessagesInner';

/**
 * 
 * @export
 * @interface GaslessEstimateRequest
 */
export interface GaslessEstimateRequest {
    /**
     * 
     * @type {string}
     * @memberof GaslessEstimateRequest
     */
    walletAddress: string;
    /**
     * 
     * @type {string}
     * @memberof GaslessEstimateRequest
     */
    walletPublicKey: string;
    /**
     * 
     * @type {Array<GaslessEstimateRequestMessagesInner>}
     * @memberof GaslessEstimateRequest
     */
    messages: Array<GaslessEstimateRequestMessagesInner>;
}

/**
 * Check if a given object implements the GaslessEstimateRequest interface.
 */
export function instanceOfGaslessEstimateRequest(value: object): value is GaslessEstimateRequest {
    if (!('walletAddress' in value) || value['walletAddress'] === undefined) return false;
    if (!('walletPublicKey' in value) || value['walletPublicKey'] === undefined) return false;
    if (!('messages' in value) || value['messages'] === undefined) return false;
    return true;
}

export function GaslessEstimateRequestFromJSON(json: any): GaslessEstimateRequest {
    return GaslessEstimateRequestFromJSONTyped(json, false);
}

export function GaslessEstimateRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): GaslessEstimateRequest {
    if (json == null) {
        return json;
    }
    return {
        
        'walletAddress': json['wallet_address'],
        'walletPublicKey': json['wallet_public_key'],
        'messages': ((json['messages'] as Array<any>).map(GaslessEstimateRequestMessagesInnerFromJSON)),
    };
}

  export function GaslessEstimateRequestToJSON(json: any): GaslessEstimateRequest {
      return GaslessEstimateRequestToJSONTyped(json, false);
  }

  export function GaslessEstimateRequestToJSONTyped(value?: GaslessEstimateRequest | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'wallet_address': value['walletAddress'],
        'wallet_public_key': value['walletPublicKey'],
        'messages': ((value['messages'] as Array<any>).map(GaslessEstimateRequestMessagesInnerToJSON)),
    };
}

