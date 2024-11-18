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
import type { MsgForwardPrices } from './MsgForwardPrices';
import {
    MsgForwardPricesFromJSON,
    MsgForwardPricesFromJSONTyped,
    MsgForwardPricesToJSON,
    MsgForwardPricesToJSONTyped,
} from './MsgForwardPrices';

/**
 * The cost of sending messages in the masterchain of the TON blockchain.
 * @export
 * @interface BlockchainConfig24
 */
export interface BlockchainConfig24 {
    /**
     * 
     * @type {MsgForwardPrices}
     * @memberof BlockchainConfig24
     */
    msgForwardPrices: MsgForwardPrices;
}

/**
 * Check if a given object implements the BlockchainConfig24 interface.
 */
export function instanceOfBlockchainConfig24(value: object): value is BlockchainConfig24 {
    if (!('msgForwardPrices' in value) || value['msgForwardPrices'] === undefined) return false;
    return true;
}

export function BlockchainConfig24FromJSON(json: any): BlockchainConfig24 {
    return BlockchainConfig24FromJSONTyped(json, false);
}

export function BlockchainConfig24FromJSONTyped(json: any, ignoreDiscriminator: boolean): BlockchainConfig24 {
    if (json == null) {
        return json;
    }
    return {
        
        'msgForwardPrices': MsgForwardPricesFromJSON(json['msg_forward_prices']),
    };
}

  export function BlockchainConfig24ToJSON(json: any): BlockchainConfig24 {
      return BlockchainConfig24ToJSONTyped(json, false);
  }

  export function BlockchainConfig24ToJSONTyped(value?: BlockchainConfig24 | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'msg_forward_prices': MsgForwardPricesToJSON(value['msgForwardPrices']),
    };
}
