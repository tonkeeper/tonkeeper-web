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
import type { ValidatorsSetListInner } from './ValidatorsSetListInner';
import {
    ValidatorsSetListInnerFromJSON,
    ValidatorsSetListInnerFromJSONTyped,
    ValidatorsSetListInnerToJSON,
    ValidatorsSetListInnerToJSONTyped,
} from './ValidatorsSetListInner';

/**
 * 
 * @export
 * @interface ValidatorsSet
 */
export interface ValidatorsSet {
    /**
     * 
     * @type {number}
     * @memberof ValidatorsSet
     */
    utimeSince: number;
    /**
     * 
     * @type {number}
     * @memberof ValidatorsSet
     */
    utimeUntil: number;
    /**
     * 
     * @type {number}
     * @memberof ValidatorsSet
     */
    total: number;
    /**
     * 
     * @type {number}
     * @memberof ValidatorsSet
     */
    main: number;
    /**
     * 
     * @type {string}
     * @memberof ValidatorsSet
     */
    totalWeight?: string;
    /**
     * 
     * @type {Array<ValidatorsSetListInner>}
     * @memberof ValidatorsSet
     */
    list: Array<ValidatorsSetListInner>;
}

/**
 * Check if a given object implements the ValidatorsSet interface.
 */
export function instanceOfValidatorsSet(value: object): value is ValidatorsSet {
    if (!('utimeSince' in value) || value['utimeSince'] === undefined) return false;
    if (!('utimeUntil' in value) || value['utimeUntil'] === undefined) return false;
    if (!('total' in value) || value['total'] === undefined) return false;
    if (!('main' in value) || value['main'] === undefined) return false;
    if (!('list' in value) || value['list'] === undefined) return false;
    return true;
}

export function ValidatorsSetFromJSON(json: any): ValidatorsSet {
    return ValidatorsSetFromJSONTyped(json, false);
}

export function ValidatorsSetFromJSONTyped(json: any, ignoreDiscriminator: boolean): ValidatorsSet {
    if (json == null) {
        return json;
    }
    return {
        
        'utimeSince': json['utime_since'],
        'utimeUntil': json['utime_until'],
        'total': json['total'],
        'main': json['main'],
        'totalWeight': json['total_weight'] == null ? undefined : json['total_weight'],
        'list': ((json['list'] as Array<any>).map(ValidatorsSetListInnerFromJSON)),
    };
}

  export function ValidatorsSetToJSON(json: any): ValidatorsSet {
      return ValidatorsSetToJSONTyped(json, false);
  }

  export function ValidatorsSetToJSONTyped(value?: ValidatorsSet | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'utime_since': value['utimeSince'],
        'utime_until': value['utimeUntil'],
        'total': value['total'],
        'main': value['main'],
        'total_weight': value['totalWeight'],
        'list': ((value['list'] as Array<any>).map(ValidatorsSetListInnerToJSON)),
    };
}

