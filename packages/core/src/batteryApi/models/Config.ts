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
 * @interface Config
 */
export interface Config {
    /**
     * cost of 1 charge in TON
     * @type {string}
     * @memberof Config
     */
    chargeCost: string;
    /**
     * with zero balance it is possible to transfer some jettons (stablecoins, jusdt, etc) to this address to refill the balance. Such transfers would be paid by Battery Service.
     * @type {string}
     * @memberof Config
     */
    fundReceiver: string;
    /**
     * when building a message to transfer an NFT or Jetton, use this address to send excess funds back to Battery Service.
     * @type {string}
     * @memberof Config
     */
    excessAccount: string;
    /**
     * ttl for message in seconds
     * @type {number}
     * @memberof Config
     */
    messageTtl: number;
}

/**
 * Check if a given object implements the Config interface.
 */
export function instanceOfConfig(value: object): value is Config {
    if (!('chargeCost' in value) || value['chargeCost'] === undefined) return false;
    if (!('fundReceiver' in value) || value['fundReceiver'] === undefined) return false;
    if (!('excessAccount' in value) || value['excessAccount'] === undefined) return false;
    if (!('messageTtl' in value) || value['messageTtl'] === undefined) return false;
    return true;
}

export function ConfigFromJSON(json: any): Config {
    return ConfigFromJSONTyped(json, false);
}

export function ConfigFromJSONTyped(json: any, ignoreDiscriminator: boolean): Config {
    if (json == null) {
        return json;
    }
    return {
        
        'chargeCost': json['charge_cost'],
        'fundReceiver': json['fund_receiver'],
        'excessAccount': json['excess_account'],
        'messageTtl': json['message_ttl'],
    };
}

  export function ConfigToJSON(json: any): Config {
      return ConfigToJSONTyped(json, false);
  }

  export function ConfigToJSONTyped(value?: Config | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'charge_cost': value['chargeCost'],
        'fund_receiver': value['fundReceiver'],
        'excess_account': value['excessAccount'],
        'message_ttl': value['messageTtl'],
    };
}

