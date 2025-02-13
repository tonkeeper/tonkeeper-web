/* tslint:disable */
/* eslint-disable */
/**
 * Custodial-Battery REST API.
 * REST API for Custodial Battery which provides gas to different networks to help execute transactions.
 *
 * The version of the OpenAPI document: 0.0.1
 * Contact: support@tonkeeper.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
import type { SignRawMessage } from './SignRawMessage';
import {
    SignRawMessageFromJSON,
    SignRawMessageFromJSONTyped,
    SignRawMessageToJSON,
    SignRawMessageToJSONTyped,
} from './SignRawMessage';

/**
 * 
 * @export
 * @interface SignRawParams
 */
export interface SignRawParams {
    /**
     * 
     * @type {string}
     * @memberof SignRawParams
     */
    relayAddress: string;
    /**
     * Commission for the transaction. In nanocoins.
     * @type {string}
     * @memberof SignRawParams
     */
    commission: string;
    /**
     * 
     * @type {string}
     * @memberof SignRawParams
     */
    from: string;
    /**
     * 
     * @type {number}
     * @memberof SignRawParams
     */
    validUntil: number;
    /**
     * 
     * @type {Array<SignRawMessage>}
     * @memberof SignRawParams
     */
    messages: Array<SignRawMessage>;
}

/**
 * Check if a given object implements the SignRawParams interface.
 */
export function instanceOfSignRawParams(value: object): value is SignRawParams {
    if (!('relayAddress' in value) || value['relayAddress'] === undefined) return false;
    if (!('commission' in value) || value['commission'] === undefined) return false;
    if (!('from' in value) || value['from'] === undefined) return false;
    if (!('validUntil' in value) || value['validUntil'] === undefined) return false;
    if (!('messages' in value) || value['messages'] === undefined) return false;
    return true;
}

export function SignRawParamsFromJSON(json: any): SignRawParams {
    return SignRawParamsFromJSONTyped(json, false);
}

export function SignRawParamsFromJSONTyped(json: any, ignoreDiscriminator: boolean): SignRawParams {
    if (json == null) {
        return json;
    }
    return {
        
        'relayAddress': json['relay_address'],
        'commission': json['commission'],
        'from': json['from'],
        'validUntil': json['valid_until'],
        'messages': ((json['messages'] as Array<any>).map(SignRawMessageFromJSON)),
    };
}

  export function SignRawParamsToJSON(json: any): SignRawParams {
      return SignRawParamsToJSONTyped(json, false);
  }

  export function SignRawParamsToJSONTyped(value?: SignRawParams | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'relay_address': value['relayAddress'],
        'commission': value['commission'],
        'from': value['from'],
        'valid_until': value['validUntil'],
        'messages': ((value['messages'] as Array<any>).map(SignRawMessageToJSON)),
    };
}

