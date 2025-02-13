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
 * @interface PurchasesPurchasesInnerRefundInformationRefunded
 */
export interface PurchasesPurchasesInnerRefundInformationRefunded {
    /**
     * 
     * @type {string}
     * @memberof PurchasesPurchasesInnerRefundInformationRefunded
     */
    amount: string;
    /**
     * 
     * @type {number}
     * @memberof PurchasesPurchasesInnerRefundInformationRefunded
     */
    charges: number;
}

/**
 * Check if a given object implements the PurchasesPurchasesInnerRefundInformationRefunded interface.
 */
export function instanceOfPurchasesPurchasesInnerRefundInformationRefunded(value: object): value is PurchasesPurchasesInnerRefundInformationRefunded {
    if (!('amount' in value) || value['amount'] === undefined) return false;
    if (!('charges' in value) || value['charges'] === undefined) return false;
    return true;
}

export function PurchasesPurchasesInnerRefundInformationRefundedFromJSON(json: any): PurchasesPurchasesInnerRefundInformationRefunded {
    return PurchasesPurchasesInnerRefundInformationRefundedFromJSONTyped(json, false);
}

export function PurchasesPurchasesInnerRefundInformationRefundedFromJSONTyped(json: any, ignoreDiscriminator: boolean): PurchasesPurchasesInnerRefundInformationRefunded {
    if (json == null) {
        return json;
    }
    return {
        
        'amount': json['amount'],
        'charges': json['charges'],
    };
}

  export function PurchasesPurchasesInnerRefundInformationRefundedToJSON(json: any): PurchasesPurchasesInnerRefundInformationRefunded {
      return PurchasesPurchasesInnerRefundInformationRefundedToJSONTyped(json, false);
  }

  export function PurchasesPurchasesInnerRefundInformationRefundedToJSONTyped(value?: PurchasesPurchasesInnerRefundInformationRefunded | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'amount': value['amount'],
        'charges': value['charges'],
    };
}

