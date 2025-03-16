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
 * @interface RelayerSendingEstimation
 */
export interface RelayerSendingEstimation {
    /**
     * 
     * @type {string}
     * @memberof RelayerSendingEstimation
     */
    commission: string;
}

/**
 * Check if a given object implements the RelayerSendingEstimation interface.
 */
export function instanceOfRelayerSendingEstimation(value: object): value is RelayerSendingEstimation {
    if (!('commission' in value) || value['commission'] === undefined) return false;
    return true;
}

export function RelayerSendingEstimationFromJSON(json: any): RelayerSendingEstimation {
    return RelayerSendingEstimationFromJSONTyped(json, false);
}

export function RelayerSendingEstimationFromJSONTyped(json: any, ignoreDiscriminator: boolean): RelayerSendingEstimation {
    if (json == null) {
        return json;
    }
    return {
        
        'commission': json['commission'],
    };
}

  export function RelayerSendingEstimationToJSON(json: any): RelayerSendingEstimation {
      return RelayerSendingEstimationToJSONTyped(json, false);
  }

  export function RelayerSendingEstimationToJSONTyped(value?: RelayerSendingEstimation | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'commission': value['commission'],
    };
}

