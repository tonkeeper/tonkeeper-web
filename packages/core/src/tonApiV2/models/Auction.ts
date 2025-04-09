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
 * @interface Auction
 */
export interface Auction {
    /**
     * 
     * @type {string}
     * @memberof Auction
     */
    domain: string;
    /**
     * 
     * @type {string}
     * @memberof Auction
     */
    owner: string;
    /**
     * 
     * @type {number}
     * @memberof Auction
     */
    price: number;
    /**
     * 
     * @type {number}
     * @memberof Auction
     */
    bids: number;
    /**
     * 
     * @type {number}
     * @memberof Auction
     */
    date: number;
}

/**
 * Check if a given object implements the Auction interface.
 */
export function instanceOfAuction(value: object): value is Auction {
    if (!('domain' in value) || value['domain'] === undefined) return false;
    if (!('owner' in value) || value['owner'] === undefined) return false;
    if (!('price' in value) || value['price'] === undefined) return false;
    if (!('bids' in value) || value['bids'] === undefined) return false;
    if (!('date' in value) || value['date'] === undefined) return false;
    return true;
}

export function AuctionFromJSON(json: any): Auction {
    return AuctionFromJSONTyped(json, false);
}

export function AuctionFromJSONTyped(json: any, ignoreDiscriminator: boolean): Auction {
    if (json == null) {
        return json;
    }
    return {
        
        'domain': json['domain'],
        'owner': json['owner'],
        'price': json['price'],
        'bids': json['bids'],
        'date': json['date'],
    };
}

export function AuctionToJSON(json: any): Auction {
    return AuctionToJSONTyped(json, false);
}

export function AuctionToJSONTyped(value?: Auction | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'domain': value['domain'],
        'owner': value['owner'],
        'price': value['price'],
        'bids': value['bids'],
        'date': value['date'],
    };
}

