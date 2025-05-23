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
import type { Price } from './Price';
import {
    PriceFromJSON,
    PriceFromJSONTyped,
    PriceToJSON,
    PriceToJSONTyped,
} from './Price';
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
 * @interface Sale
 */
export interface Sale {
    /**
     * 
     * @type {string}
     * @memberof Sale
     */
    address: string;
    /**
     * 
     * @type {AccountAddress}
     * @memberof Sale
     */
    market: AccountAddress;
    /**
     * 
     * @type {AccountAddress}
     * @memberof Sale
     */
    owner?: AccountAddress;
    /**
     * 
     * @type {Price}
     * @memberof Sale
     */
    price: Price;
}

/**
 * Check if a given object implements the Sale interface.
 */
export function instanceOfSale(value: object): value is Sale {
    if (!('address' in value) || value['address'] === undefined) return false;
    if (!('market' in value) || value['market'] === undefined) return false;
    if (!('price' in value) || value['price'] === undefined) return false;
    return true;
}

export function SaleFromJSON(json: any): Sale {
    return SaleFromJSONTyped(json, false);
}

export function SaleFromJSONTyped(json: any, ignoreDiscriminator: boolean): Sale {
    if (json == null) {
        return json;
    }
    return {
        
        'address': json['address'],
        'market': AccountAddressFromJSON(json['market']),
        'owner': json['owner'] == null ? undefined : AccountAddressFromJSON(json['owner']),
        'price': PriceFromJSON(json['price']),
    };
}

export function SaleToJSON(json: any): Sale {
    return SaleToJSONTyped(json, false);
}

export function SaleToJSONTyped(value?: Sale | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'address': value['address'],
        'market': AccountAddressToJSON(value['market']),
        'owner': AccountAddressToJSON(value['owner']),
        'price': PriceToJSON(value['price']),
    };
}

