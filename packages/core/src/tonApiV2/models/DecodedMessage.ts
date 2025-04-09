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
import type { DecodedMessageExtInMsgDecoded } from './DecodedMessageExtInMsgDecoded';
import {
    DecodedMessageExtInMsgDecodedFromJSON,
    DecodedMessageExtInMsgDecodedFromJSONTyped,
    DecodedMessageExtInMsgDecodedToJSON,
    DecodedMessageExtInMsgDecodedToJSONTyped,
} from './DecodedMessageExtInMsgDecoded';
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
 * @interface DecodedMessage
 */
export interface DecodedMessage {
    /**
     * 
     * @type {AccountAddress}
     * @memberof DecodedMessage
     */
    destination: AccountAddress;
    /**
     * 
     * @type {string}
     * @memberof DecodedMessage
     */
    destinationWalletVersion: string;
    /**
     * 
     * @type {DecodedMessageExtInMsgDecoded}
     * @memberof DecodedMessage
     */
    extInMsgDecoded?: DecodedMessageExtInMsgDecoded;
}

/**
 * Check if a given object implements the DecodedMessage interface.
 */
export function instanceOfDecodedMessage(value: object): value is DecodedMessage {
    if (!('destination' in value) || value['destination'] === undefined) return false;
    if (!('destinationWalletVersion' in value) || value['destinationWalletVersion'] === undefined) return false;
    return true;
}

export function DecodedMessageFromJSON(json: any): DecodedMessage {
    return DecodedMessageFromJSONTyped(json, false);
}

export function DecodedMessageFromJSONTyped(json: any, ignoreDiscriminator: boolean): DecodedMessage {
    if (json == null) {
        return json;
    }
    return {
        
        'destination': AccountAddressFromJSON(json['destination']),
        'destinationWalletVersion': json['destination_wallet_version'],
        'extInMsgDecoded': json['ext_in_msg_decoded'] == null ? undefined : DecodedMessageExtInMsgDecodedFromJSON(json['ext_in_msg_decoded']),
    };
}

export function DecodedMessageToJSON(json: any): DecodedMessage {
    return DecodedMessageToJSONTyped(json, false);
}

export function DecodedMessageToJSONTyped(value?: DecodedMessage | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'destination': AccountAddressToJSON(value['destination']),
        'destination_wallet_version': value['destinationWalletVersion'],
        'ext_in_msg_decoded': DecodedMessageExtInMsgDecodedToJSON(value['extInMsgDecoded']),
    };
}

