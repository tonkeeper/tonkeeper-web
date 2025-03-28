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
 * @interface Oracle
 */
export interface Oracle {
    /**
     * 
     * @type {string}
     * @memberof Oracle
     */
    address: string;
    /**
     * 
     * @type {string}
     * @memberof Oracle
     */
    secpPubkey: string;
}

/**
 * Check if a given object implements the Oracle interface.
 */
export function instanceOfOracle(value: object): value is Oracle {
    if (!('address' in value) || value['address'] === undefined) return false;
    if (!('secpPubkey' in value) || value['secpPubkey'] === undefined) return false;
    return true;
}

export function OracleFromJSON(json: any): Oracle {
    return OracleFromJSONTyped(json, false);
}

export function OracleFromJSONTyped(json: any, ignoreDiscriminator: boolean): Oracle {
    if (json == null) {
        return json;
    }
    return {
        
        'address': json['address'],
        'secpPubkey': json['secp_pubkey'],
    };
}

export function OracleToJSON(json: any): Oracle {
    return OracleToJSONTyped(json, false);
}

export function OracleToJSONTyped(value?: Oracle | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'address': value['address'],
        'secp_pubkey': value['secpPubkey'],
    };
}

