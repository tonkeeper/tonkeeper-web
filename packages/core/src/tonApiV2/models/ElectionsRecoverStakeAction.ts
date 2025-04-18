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
 * @interface ElectionsRecoverStakeAction
 */
export interface ElectionsRecoverStakeAction {
    /**
     * 
     * @type {number}
     * @memberof ElectionsRecoverStakeAction
     */
    amount: number;
    /**
     * 
     * @type {AccountAddress}
     * @memberof ElectionsRecoverStakeAction
     */
    staker: AccountAddress;
}

/**
 * Check if a given object implements the ElectionsRecoverStakeAction interface.
 */
export function instanceOfElectionsRecoverStakeAction(value: object): value is ElectionsRecoverStakeAction {
    if (!('amount' in value) || value['amount'] === undefined) return false;
    if (!('staker' in value) || value['staker'] === undefined) return false;
    return true;
}

export function ElectionsRecoverStakeActionFromJSON(json: any): ElectionsRecoverStakeAction {
    return ElectionsRecoverStakeActionFromJSONTyped(json, false);
}

export function ElectionsRecoverStakeActionFromJSONTyped(json: any, ignoreDiscriminator: boolean): ElectionsRecoverStakeAction {
    if (json == null) {
        return json;
    }
    return {
        
        'amount': json['amount'],
        'staker': AccountAddressFromJSON(json['staker']),
    };
}

export function ElectionsRecoverStakeActionToJSON(json: any): ElectionsRecoverStakeAction {
    return ElectionsRecoverStakeActionToJSONTyped(json, false);
}

export function ElectionsRecoverStakeActionToJSONTyped(value?: ElectionsRecoverStakeAction | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'amount': value['amount'],
        'staker': AccountAddressToJSON(value['staker']),
    };
}

