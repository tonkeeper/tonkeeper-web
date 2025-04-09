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
import type { PoolImplementation } from './PoolImplementation';
import {
    PoolImplementationFromJSON,
    PoolImplementationFromJSONTyped,
    PoolImplementationToJSON,
    PoolImplementationToJSONTyped,
} from './PoolImplementation';
import type { PoolInfo } from './PoolInfo';
import {
    PoolInfoFromJSON,
    PoolInfoFromJSONTyped,
    PoolInfoToJSON,
    PoolInfoToJSONTyped,
} from './PoolInfo';

/**
 * 
 * @export
 * @interface GetStakingPoolInfo200Response
 */
export interface GetStakingPoolInfo200Response {
    /**
     * 
     * @type {PoolImplementation}
     * @memberof GetStakingPoolInfo200Response
     */
    implementation: PoolImplementation;
    /**
     * 
     * @type {PoolInfo}
     * @memberof GetStakingPoolInfo200Response
     */
    pool: PoolInfo;
}

/**
 * Check if a given object implements the GetStakingPoolInfo200Response interface.
 */
export function instanceOfGetStakingPoolInfo200Response(value: object): value is GetStakingPoolInfo200Response {
    if (!('implementation' in value) || value['implementation'] === undefined) return false;
    if (!('pool' in value) || value['pool'] === undefined) return false;
    return true;
}

export function GetStakingPoolInfo200ResponseFromJSON(json: any): GetStakingPoolInfo200Response {
    return GetStakingPoolInfo200ResponseFromJSONTyped(json, false);
}

export function GetStakingPoolInfo200ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetStakingPoolInfo200Response {
    if (json == null) {
        return json;
    }
    return {
        
        'implementation': PoolImplementationFromJSON(json['implementation']),
        'pool': PoolInfoFromJSON(json['pool']),
    };
}

export function GetStakingPoolInfo200ResponseToJSON(json: any): GetStakingPoolInfo200Response {
    return GetStakingPoolInfo200ResponseToJSONTyped(json, false);
}

export function GetStakingPoolInfo200ResponseToJSONTyped(value?: GetStakingPoolInfo200Response | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'implementation': PoolImplementationToJSON(value['implementation']),
        'pool': PoolInfoToJSON(value['pool']),
    };
}

