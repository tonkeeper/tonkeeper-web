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
import type { JettonPreview } from './JettonPreview';
import {
    JettonPreviewFromJSON,
    JettonPreviewFromJSONTyped,
    JettonPreviewToJSON,
    JettonPreviewToJSONTyped,
} from './JettonPreview';
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
 * @interface JettonQuantity
 */
export interface JettonQuantity {
    /**
     * 
     * @type {string}
     * @memberof JettonQuantity
     */
    quantity: string;
    /**
     * 
     * @type {AccountAddress}
     * @memberof JettonQuantity
     */
    walletAddress: AccountAddress;
    /**
     * 
     * @type {JettonPreview}
     * @memberof JettonQuantity
     */
    jetton: JettonPreview;
}

/**
 * Check if a given object implements the JettonQuantity interface.
 */
export function instanceOfJettonQuantity(value: object): value is JettonQuantity {
    if (!('quantity' in value) || value['quantity'] === undefined) return false;
    if (!('walletAddress' in value) || value['walletAddress'] === undefined) return false;
    if (!('jetton' in value) || value['jetton'] === undefined) return false;
    return true;
}

export function JettonQuantityFromJSON(json: any): JettonQuantity {
    return JettonQuantityFromJSONTyped(json, false);
}

export function JettonQuantityFromJSONTyped(json: any, ignoreDiscriminator: boolean): JettonQuantity {
    if (json == null) {
        return json;
    }
    return {
        
        'quantity': json['quantity'],
        'walletAddress': AccountAddressFromJSON(json['wallet_address']),
        'jetton': JettonPreviewFromJSON(json['jetton']),
    };
}

export function JettonQuantityToJSON(json: any): JettonQuantity {
    return JettonQuantityToJSONTyped(json, false);
}

export function JettonQuantityToJSONTyped(value?: JettonQuantity | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'quantity': value['quantity'],
        'wallet_address': AccountAddressToJSON(value['walletAddress']),
        'jetton': JettonPreviewToJSON(value['jetton']),
    };
}

