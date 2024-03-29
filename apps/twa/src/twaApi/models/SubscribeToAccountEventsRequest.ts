/* tslint:disable */
/* eslint-disable */
/**
 * Tonkeeper TWA API.
 * REST API for Tonkeeper TWA.
 *
 * The version of the OpenAPI document: 0.0.1
 * Contact: support@tonkeeper.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { SubscribeToAccountEventsRequestProof } from './SubscribeToAccountEventsRequestProof';
import {
    SubscribeToAccountEventsRequestProofFromJSON,
    SubscribeToAccountEventsRequestProofFromJSONTyped,
    SubscribeToAccountEventsRequestProofToJSON,
} from './SubscribeToAccountEventsRequestProof';

/**
 * 
 * @export
 * @interface SubscribeToAccountEventsRequest
 */
export interface SubscribeToAccountEventsRequest {
    /**
     * Base64 encoded twa init data
     * @type {string}
     * @memberof SubscribeToAccountEventsRequest
     */
    twaInitData: string;
    /**
     * Wallet or smart contract address
     * @type {string}
     * @memberof SubscribeToAccountEventsRequest
     */
    address: string;
    /**
     * 
     * @type {SubscribeToAccountEventsRequestProof}
     * @memberof SubscribeToAccountEventsRequest
     */
    proof: SubscribeToAccountEventsRequestProof;
}

/**
 * Check if a given object implements the SubscribeToAccountEventsRequest interface.
 */
export function instanceOfSubscribeToAccountEventsRequest(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "twaInitData" in value;
    isInstance = isInstance && "address" in value;
    isInstance = isInstance && "proof" in value;

    return isInstance;
}

export function SubscribeToAccountEventsRequestFromJSON(json: any): SubscribeToAccountEventsRequest {
    return SubscribeToAccountEventsRequestFromJSONTyped(json, false);
}

export function SubscribeToAccountEventsRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): SubscribeToAccountEventsRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'twaInitData': json['twa_init_data'],
        'address': json['address'],
        'proof': SubscribeToAccountEventsRequestProofFromJSON(json['proof']),
    };
}

export function SubscribeToAccountEventsRequestToJSON(value?: SubscribeToAccountEventsRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'twa_init_data': value.twaInitData,
        'address': value.address,
        'proof': SubscribeToAccountEventsRequestProofToJSON(value.proof),
    };
}

