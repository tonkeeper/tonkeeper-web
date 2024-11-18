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
import type { NftCollection } from './NftCollection';
import {
    NftCollectionFromJSON,
    NftCollectionFromJSONTyped,
    NftCollectionToJSON,
    NftCollectionToJSONTyped,
} from './NftCollection';

/**
 * 
 * @export
 * @interface NftCollections
 */
export interface NftCollections {
    /**
     * 
     * @type {Array<NftCollection>}
     * @memberof NftCollections
     */
    nftCollections: Array<NftCollection>;
}

/**
 * Check if a given object implements the NftCollections interface.
 */
export function instanceOfNftCollections(value: object): value is NftCollections {
    if (!('nftCollections' in value) || value['nftCollections'] === undefined) return false;
    return true;
}

export function NftCollectionsFromJSON(json: any): NftCollections {
    return NftCollectionsFromJSONTyped(json, false);
}

export function NftCollectionsFromJSONTyped(json: any, ignoreDiscriminator: boolean): NftCollections {
    if (json == null) {
        return json;
    }
    return {
        
        'nftCollections': ((json['nft_collections'] as Array<any>).map(NftCollectionFromJSON)),
    };
}

  export function NftCollectionsToJSON(json: any): NftCollections {
      return NftCollectionsToJSONTyped(json, false);
  }

  export function NftCollectionsToJSONTyped(value?: NftCollections | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'nft_collections': ((value['nftCollections'] as Array<any>).map(NftCollectionToJSON)),
    };
}
