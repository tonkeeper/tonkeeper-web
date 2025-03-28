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
 * List of critical TON parameters, the change of which significantly affects the network, so more voting rounds are held.
 * @export
 * @interface BlockchainConfig10
 */
export interface BlockchainConfig10 {
    /**
     * 
     * @type {Array<number>}
     * @memberof BlockchainConfig10
     */
    criticalParams: Array<number>;
}

/**
 * Check if a given object implements the BlockchainConfig10 interface.
 */
export function instanceOfBlockchainConfig10(value: object): value is BlockchainConfig10 {
    if (!('criticalParams' in value) || value['criticalParams'] === undefined) return false;
    return true;
}

export function BlockchainConfig10FromJSON(json: any): BlockchainConfig10 {
    return BlockchainConfig10FromJSONTyped(json, false);
}

export function BlockchainConfig10FromJSONTyped(json: any, ignoreDiscriminator: boolean): BlockchainConfig10 {
    if (json == null) {
        return json;
    }
    return {
        
        'criticalParams': json['critical_params'],
    };
}

export function BlockchainConfig10ToJSON(json: any): BlockchainConfig10 {
    return BlockchainConfig10ToJSONTyped(json, false);
}

export function BlockchainConfig10ToJSONTyped(value?: BlockchainConfig10 | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'critical_params': value['criticalParams'],
    };
}

