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
/**
 * 
 * @export
 * @interface Price
 */
export interface Price {
    /**
     * 
     * @type {string}
     * @memberof Price
     */
    value: string;
    /**
     * 
     * @type {string}
     * @memberof Price
     */
    tokenName: string;
}

/**
 * Check if a given object implements the Price interface.
 */
export function instanceOfPrice(value: object): value is Price {
    if (!('value' in value) || value['value'] === undefined) return false;
    if (!('tokenName' in value) || value['tokenName'] === undefined) return false;
    return true;
}

export function PriceFromJSON(json: any): Price {
    return PriceFromJSONTyped(json, false);
}

export function PriceFromJSONTyped(json: any, ignoreDiscriminator: boolean): Price {
    if (json == null) {
        return json;
    }
    return {
        
        'value': json['value'],
        'tokenName': json['token_name'],
    };
}

  export function PriceToJSON(json: any): Price {
      return PriceToJSONTyped(json, false);
  }

  export function PriceToJSONTyped(value?: Price | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'value': value['value'],
        'token_name': value['tokenName'],
    };
}

