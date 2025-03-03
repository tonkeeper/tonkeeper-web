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
 * @interface StatusPendingTransactionsInner
 */
export interface StatusPendingTransactionsInner {
    /**
     * 
     * @type {string}
     * @memberof StatusPendingTransactionsInner
     */
    id: string;
}

/**
 * Check if a given object implements the StatusPendingTransactionsInner interface.
 */
export function instanceOfStatusPendingTransactionsInner(value: object): value is StatusPendingTransactionsInner {
    if (!('id' in value) || value['id'] === undefined) return false;
    return true;
}

export function StatusPendingTransactionsInnerFromJSON(json: any): StatusPendingTransactionsInner {
    return StatusPendingTransactionsInnerFromJSONTyped(json, false);
}

export function StatusPendingTransactionsInnerFromJSONTyped(json: any, ignoreDiscriminator: boolean): StatusPendingTransactionsInner {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'],
    };
}

  export function StatusPendingTransactionsInnerToJSON(json: any): StatusPendingTransactionsInner {
      return StatusPendingTransactionsInnerToJSONTyped(json, false);
  }

  export function StatusPendingTransactionsInnerToJSONTyped(value?: StatusPendingTransactionsInner | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'id': value['id'],
    };
}

