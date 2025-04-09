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
/**
 * 
 * @export
 * @interface ConfigProposalSetup
 */
export interface ConfigProposalSetup {
    /**
     * 
     * @type {number}
     * @memberof ConfigProposalSetup
     */
    minTotRounds: number;
    /**
     * 
     * @type {number}
     * @memberof ConfigProposalSetup
     */
    maxTotRounds: number;
    /**
     * 
     * @type {number}
     * @memberof ConfigProposalSetup
     */
    minWins: number;
    /**
     * 
     * @type {number}
     * @memberof ConfigProposalSetup
     */
    maxLosses: number;
    /**
     * 
     * @type {number}
     * @memberof ConfigProposalSetup
     */
    minStoreSec: number;
    /**
     * 
     * @type {number}
     * @memberof ConfigProposalSetup
     */
    maxStoreSec: number;
    /**
     * 
     * @type {number}
     * @memberof ConfigProposalSetup
     */
    bitPrice: number;
    /**
     * 
     * @type {number}
     * @memberof ConfigProposalSetup
     */
    cellPrice: number;
}

/**
 * Check if a given object implements the ConfigProposalSetup interface.
 */
export function instanceOfConfigProposalSetup(value: object): value is ConfigProposalSetup {
    if (!('minTotRounds' in value) || value['minTotRounds'] === undefined) return false;
    if (!('maxTotRounds' in value) || value['maxTotRounds'] === undefined) return false;
    if (!('minWins' in value) || value['minWins'] === undefined) return false;
    if (!('maxLosses' in value) || value['maxLosses'] === undefined) return false;
    if (!('minStoreSec' in value) || value['minStoreSec'] === undefined) return false;
    if (!('maxStoreSec' in value) || value['maxStoreSec'] === undefined) return false;
    if (!('bitPrice' in value) || value['bitPrice'] === undefined) return false;
    if (!('cellPrice' in value) || value['cellPrice'] === undefined) return false;
    return true;
}

export function ConfigProposalSetupFromJSON(json: any): ConfigProposalSetup {
    return ConfigProposalSetupFromJSONTyped(json, false);
}

export function ConfigProposalSetupFromJSONTyped(json: any, ignoreDiscriminator: boolean): ConfigProposalSetup {
    if (json == null) {
        return json;
    }
    return {
        
        'minTotRounds': json['min_tot_rounds'],
        'maxTotRounds': json['max_tot_rounds'],
        'minWins': json['min_wins'],
        'maxLosses': json['max_losses'],
        'minStoreSec': json['min_store_sec'],
        'maxStoreSec': json['max_store_sec'],
        'bitPrice': json['bit_price'],
        'cellPrice': json['cell_price'],
    };
}

export function ConfigProposalSetupToJSON(json: any): ConfigProposalSetup {
    return ConfigProposalSetupToJSONTyped(json, false);
}

export function ConfigProposalSetupToJSONTyped(value?: ConfigProposalSetup | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'min_tot_rounds': value['minTotRounds'],
        'max_tot_rounds': value['maxTotRounds'],
        'min_wins': value['minWins'],
        'max_losses': value['maxLosses'],
        'min_store_sec': value['minStoreSec'],
        'max_store_sec': value['maxStoreSec'],
        'bit_price': value['bitPrice'],
        'cell_price': value['cellPrice'],
    };
}

