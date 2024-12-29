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
 * @interface StorageProvider
 */
export interface StorageProvider {
    /**
     * 
     * @type {string}
     * @memberof StorageProvider
     */
    address: string;
    /**
     * 
     * @type {boolean}
     * @memberof StorageProvider
     */
    acceptNewContracts: boolean;
    /**
     * 
     * @type {number}
     * @memberof StorageProvider
     */
    ratePerMbDay: number;
    /**
     * 
     * @type {number}
     * @memberof StorageProvider
     */
    maxSpan: number;
    /**
     * 
     * @type {number}
     * @memberof StorageProvider
     */
    minimalFileSize: number;
    /**
     * 
     * @type {number}
     * @memberof StorageProvider
     */
    maximalFileSize: number;
}

/**
 * Check if a given object implements the StorageProvider interface.
 */
export function instanceOfStorageProvider(value: object): value is StorageProvider {
    if (!('address' in value) || value['address'] === undefined) return false;
    if (!('acceptNewContracts' in value) || value['acceptNewContracts'] === undefined) return false;
    if (!('ratePerMbDay' in value) || value['ratePerMbDay'] === undefined) return false;
    if (!('maxSpan' in value) || value['maxSpan'] === undefined) return false;
    if (!('minimalFileSize' in value) || value['minimalFileSize'] === undefined) return false;
    if (!('maximalFileSize' in value) || value['maximalFileSize'] === undefined) return false;
    return true;
}

export function StorageProviderFromJSON(json: any): StorageProvider {
    return StorageProviderFromJSONTyped(json, false);
}

export function StorageProviderFromJSONTyped(json: any, ignoreDiscriminator: boolean): StorageProvider {
    if (json == null) {
        return json;
    }
    return {
        
        'address': json['address'],
        'acceptNewContracts': json['accept_new_contracts'],
        'ratePerMbDay': json['rate_per_mb_day'],
        'maxSpan': json['max_span'],
        'minimalFileSize': json['minimal_file_size'],
        'maximalFileSize': json['maximal_file_size'],
    };
}

  export function StorageProviderToJSON(json: any): StorageProvider {
      return StorageProviderToJSONTyped(json, false);
  }

  export function StorageProviderToJSONTyped(value?: StorageProvider | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'address': value['address'],
        'accept_new_contracts': value['acceptNewContracts'],
        'rate_per_mb_day': value['ratePerMbDay'],
        'max_span': value['maxSpan'],
        'minimal_file_size': value['minimalFileSize'],
        'maximal_file_size': value['maximalFileSize'],
    };
}

