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
import type { TokenRates } from './TokenRates';
import {
    TokenRatesFromJSON,
    TokenRatesFromJSONTyped,
    TokenRatesToJSON,
    TokenRatesToJSONTyped,
} from './TokenRates';
import type { AccountAddress } from './AccountAddress';
import {
    AccountAddressFromJSON,
    AccountAddressFromJSONTyped,
    AccountAddressToJSON,
    AccountAddressToJSONTyped,
} from './AccountAddress';
import type { JettonBalanceLock } from './JettonBalanceLock';
import {
    JettonBalanceLockFromJSON,
    JettonBalanceLockFromJSONTyped,
    JettonBalanceLockToJSON,
    JettonBalanceLockToJSONTyped,
} from './JettonBalanceLock';

/**
 * 
 * @export
 * @interface JettonBalance
 */
export interface JettonBalance {
    /**
     * 
     * @type {string}
     * @memberof JettonBalance
     */
    balance: string;
    /**
     * 
     * @type {TokenRates}
     * @memberof JettonBalance
     */
    price?: TokenRates;
    /**
     * 
     * @type {AccountAddress}
     * @memberof JettonBalance
     */
    walletAddress: AccountAddress;
    /**
     * 
     * @type {JettonPreview}
     * @memberof JettonBalance
     */
    jetton: JettonPreview;
    /**
     * 
     * @type {Array<string>}
     * @memberof JettonBalance
     */
    extensions?: Array<string>;
    /**
     * 
     * @type {JettonBalanceLock}
     * @memberof JettonBalance
     */
    lock?: JettonBalanceLock;
}

/**
 * Check if a given object implements the JettonBalance interface.
 */
export function instanceOfJettonBalance(value: object): value is JettonBalance {
    if (!('balance' in value) || value['balance'] === undefined) return false;
    if (!('walletAddress' in value) || value['walletAddress'] === undefined) return false;
    if (!('jetton' in value) || value['jetton'] === undefined) return false;
    return true;
}

export function JettonBalanceFromJSON(json: any): JettonBalance {
    return JettonBalanceFromJSONTyped(json, false);
}

export function JettonBalanceFromJSONTyped(json: any, ignoreDiscriminator: boolean): JettonBalance {
    if (json == null) {
        return json;
    }
    return {
        
        'balance': json['balance'],
        'price': json['price'] == null ? undefined : TokenRatesFromJSON(json['price']),
        'walletAddress': AccountAddressFromJSON(json['wallet_address']),
        'jetton': JettonPreviewFromJSON(json['jetton']),
        'extensions': json['extensions'] == null ? undefined : json['extensions'],
        'lock': json['lock'] == null ? undefined : JettonBalanceLockFromJSON(json['lock']),
    };
}

export function JettonBalanceToJSON(json: any): JettonBalance {
    return JettonBalanceToJSONTyped(json, false);
}

export function JettonBalanceToJSONTyped(value?: JettonBalance | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'balance': value['balance'],
        'price': TokenRatesToJSON(value['price']),
        'wallet_address': AccountAddressToJSON(value['walletAddress']),
        'jetton': JettonPreviewToJSON(value['jetton']),
        'extensions': value['extensions'],
        'lock': JettonBalanceLockToJSON(value['lock']),
    };
}

