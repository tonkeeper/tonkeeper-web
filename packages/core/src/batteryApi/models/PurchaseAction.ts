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
import type { Price } from './Price';
import {
    PriceFromJSON,
    PriceFromJSONTyped,
    PriceToJSON,
    PriceToJSONTyped,
} from './Price';
import type { Metadata } from './Metadata';
import {
    MetadataFromJSON,
    MetadataFromJSONTyped,
    MetadataToJSON,
    MetadataToJSONTyped,
} from './Metadata';
import type { AccountAddress } from './AccountAddress';
import {
    AccountAddressFromJSON,
    AccountAddressFromJSONTyped,
    AccountAddressToJSON,
    AccountAddressToJSONTyped,
} from './AccountAddress';

/**
 * 
 * @export
 * @interface PurchaseAction
 */
export interface PurchaseAction {
    /**
     * 
     * @type {AccountAddress}
     * @memberof PurchaseAction
     */
    source: AccountAddress;
    /**
     * 
     * @type {AccountAddress}
     * @memberof PurchaseAction
     */
    destination: AccountAddress;
    /**
     * 
     * @type {string}
     * @memberof PurchaseAction
     */
    invoiceId: string;
    /**
     * 
     * @type {Price}
     * @memberof PurchaseAction
     */
    amount: Price;
    /**
     * 
     * @type {Metadata}
     * @memberof PurchaseAction
     */
    metadata: Metadata;
}

/**
 * Check if a given object implements the PurchaseAction interface.
 */
export function instanceOfPurchaseAction(value: object): value is PurchaseAction {
    if (!('source' in value) || value['source'] === undefined) return false;
    if (!('destination' in value) || value['destination'] === undefined) return false;
    if (!('invoiceId' in value) || value['invoiceId'] === undefined) return false;
    if (!('amount' in value) || value['amount'] === undefined) return false;
    if (!('metadata' in value) || value['metadata'] === undefined) return false;
    return true;
}

export function PurchaseActionFromJSON(json: any): PurchaseAction {
    return PurchaseActionFromJSONTyped(json, false);
}

export function PurchaseActionFromJSONTyped(json: any, ignoreDiscriminator: boolean): PurchaseAction {
    if (json == null) {
        return json;
    }
    return {
        
        'source': AccountAddressFromJSON(json['source']),
        'destination': AccountAddressFromJSON(json['destination']),
        'invoiceId': json['invoice_id'],
        'amount': PriceFromJSON(json['amount']),
        'metadata': MetadataFromJSON(json['metadata']),
    };
}

  export function PurchaseActionToJSON(json: any): PurchaseAction {
      return PurchaseActionToJSONTyped(json, false);
  }

  export function PurchaseActionToJSONTyped(value?: PurchaseAction | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'source': AccountAddressToJSON(value['source']),
        'destination': AccountAddressToJSON(value['destination']),
        'invoice_id': value['invoiceId'],
        'amount': PriceToJSON(value['amount']),
        'metadata': MetadataToJSON(value['metadata']),
    };
}

