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
import type { JettonPreview } from './JettonPreview';
import {
    JettonPreviewFromJSON,
    JettonPreviewFromJSONTyped,
    JettonPreviewToJSON,
    JettonPreviewToJSONTyped,
} from './JettonPreview';
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
 * @interface JettonSwapAction
 */
export interface JettonSwapAction {
    /**
     * 
     * @type {string}
     * @memberof JettonSwapAction
     */
    dex: JettonSwapActionDexEnum;
    /**
     * 
     * @type {string}
     * @memberof JettonSwapAction
     */
    amountIn: string;
    /**
     * 
     * @type {string}
     * @memberof JettonSwapAction
     */
    amountOut: string;
    /**
     * 
     * @type {number}
     * @memberof JettonSwapAction
     */
    tonIn?: number;
    /**
     * 
     * @type {number}
     * @memberof JettonSwapAction
     */
    tonOut?: number;
    /**
     * 
     * @type {AccountAddress}
     * @memberof JettonSwapAction
     */
    userWallet: AccountAddress;
    /**
     * 
     * @type {AccountAddress}
     * @memberof JettonSwapAction
     */
    router: AccountAddress;
    /**
     * 
     * @type {JettonPreview}
     * @memberof JettonSwapAction
     */
    jettonMasterIn?: JettonPreview;
    /**
     * 
     * @type {JettonPreview}
     * @memberof JettonSwapAction
     */
    jettonMasterOut?: JettonPreview;
}


/**
 * @export
 */
export const JettonSwapActionDexEnum = {
    Stonfi: 'stonfi',
    Dedust: 'dedust',
    Megatonfi: 'megatonfi'
} as const;
export type JettonSwapActionDexEnum = typeof JettonSwapActionDexEnum[keyof typeof JettonSwapActionDexEnum];


/**
 * Check if a given object implements the JettonSwapAction interface.
 */
export function instanceOfJettonSwapAction(value: object): value is JettonSwapAction {
    if (!('dex' in value) || value['dex'] === undefined) return false;
    if (!('amountIn' in value) || value['amountIn'] === undefined) return false;
    if (!('amountOut' in value) || value['amountOut'] === undefined) return false;
    if (!('userWallet' in value) || value['userWallet'] === undefined) return false;
    if (!('router' in value) || value['router'] === undefined) return false;
    return true;
}

export function JettonSwapActionFromJSON(json: any): JettonSwapAction {
    return JettonSwapActionFromJSONTyped(json, false);
}

export function JettonSwapActionFromJSONTyped(json: any, ignoreDiscriminator: boolean): JettonSwapAction {
    if (json == null) {
        return json;
    }
    return {
        
        'dex': json['dex'],
        'amountIn': json['amount_in'],
        'amountOut': json['amount_out'],
        'tonIn': json['ton_in'] == null ? undefined : json['ton_in'],
        'tonOut': json['ton_out'] == null ? undefined : json['ton_out'],
        'userWallet': AccountAddressFromJSON(json['user_wallet']),
        'router': AccountAddressFromJSON(json['router']),
        'jettonMasterIn': json['jetton_master_in'] == null ? undefined : JettonPreviewFromJSON(json['jetton_master_in']),
        'jettonMasterOut': json['jetton_master_out'] == null ? undefined : JettonPreviewFromJSON(json['jetton_master_out']),
    };
}

export function JettonSwapActionToJSON(json: any): JettonSwapAction {
    return JettonSwapActionToJSONTyped(json, false);
}

export function JettonSwapActionToJSONTyped(value?: JettonSwapAction | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'dex': value['dex'],
        'amount_in': value['amountIn'],
        'amount_out': value['amountOut'],
        'ton_in': value['tonIn'],
        'ton_out': value['tonOut'],
        'user_wallet': AccountAddressToJSON(value['userWallet']),
        'router': AccountAddressToJSON(value['router']),
        'jetton_master_in': JettonPreviewToJSON(value['jettonMasterIn']),
        'jetton_master_out': JettonPreviewToJSON(value['jettonMasterOut']),
    };
}

