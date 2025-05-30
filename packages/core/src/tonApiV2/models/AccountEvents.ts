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
import type { AccountEvent } from './AccountEvent';
import {
    AccountEventFromJSON,
    AccountEventFromJSONTyped,
    AccountEventToJSON,
    AccountEventToJSONTyped,
} from './AccountEvent';

/**
 * 
 * @export
 * @interface AccountEvents
 */
export interface AccountEvents {
    /**
     * 
     * @type {Array<AccountEvent>}
     * @memberof AccountEvents
     */
    events: Array<AccountEvent>;
    /**
     * 
     * @type {number}
     * @memberof AccountEvents
     */
    nextFrom: number;
}

/**
 * Check if a given object implements the AccountEvents interface.
 */
export function instanceOfAccountEvents(value: object): value is AccountEvents {
    if (!('events' in value) || value['events'] === undefined) return false;
    if (!('nextFrom' in value) || value['nextFrom'] === undefined) return false;
    return true;
}

export function AccountEventsFromJSON(json: any): AccountEvents {
    return AccountEventsFromJSONTyped(json, false);
}

export function AccountEventsFromJSONTyped(json: any, ignoreDiscriminator: boolean): AccountEvents {
    if (json == null) {
        return json;
    }
    return {
        
        'events': ((json['events'] as Array<any>).map(AccountEventFromJSON)),
        'nextFrom': json['next_from'],
    };
}

export function AccountEventsToJSON(json: any): AccountEvents {
    return AccountEventsToJSONTyped(json, false);
}

export function AccountEventsToJSONTyped(value?: AccountEvents | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'events': ((value['events'] as Array<any>).map(AccountEventToJSON)),
        'next_from': value['nextFrom'],
    };
}

