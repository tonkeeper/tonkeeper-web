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
 * @interface GaslessConfigGasJettonsInner
 */
export interface GaslessConfigGasJettonsInner {
    /**
     * 
     * @type {string}
     * @memberof GaslessConfigGasJettonsInner
     */
    masterId: string;
}

/**
 * Check if a given object implements the GaslessConfigGasJettonsInner interface.
 */
export function instanceOfGaslessConfigGasJettonsInner(value: object): value is GaslessConfigGasJettonsInner {
    if (!('masterId' in value) || value['masterId'] === undefined) return false;
    return true;
}

export function GaslessConfigGasJettonsInnerFromJSON(json: any): GaslessConfigGasJettonsInner {
    return GaslessConfigGasJettonsInnerFromJSONTyped(json, false);
}

export function GaslessConfigGasJettonsInnerFromJSONTyped(json: any, ignoreDiscriminator: boolean): GaslessConfigGasJettonsInner {
    if (json == null) {
        return json;
    }
    return {
        
        'masterId': json['master_id'],
    };
}

export function GaslessConfigGasJettonsInnerToJSON(json: any): GaslessConfigGasJettonsInner {
    return GaslessConfigGasJettonsInnerToJSONTyped(json, false);
}

export function GaslessConfigGasJettonsInnerToJSONTyped(value?: GaslessConfigGasJettonsInner | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'master_id': value['masterId'],
    };
}

