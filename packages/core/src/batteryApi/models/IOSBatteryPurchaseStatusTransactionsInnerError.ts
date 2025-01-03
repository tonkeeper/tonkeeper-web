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
 * @interface IOSBatteryPurchaseStatusTransactionsInnerError
 */
export interface IOSBatteryPurchaseStatusTransactionsInnerError {
    /**
     * 
     * @type {string}
     * @memberof IOSBatteryPurchaseStatusTransactionsInnerError
     */
    msg: string;
    /**
     * 
     * @type {string}
     * @memberof IOSBatteryPurchaseStatusTransactionsInnerError
     */
    code: IOSBatteryPurchaseStatusTransactionsInnerErrorCodeEnum;
}


/**
 * @export
 */
export const IOSBatteryPurchaseStatusTransactionsInnerErrorCodeEnum = {
    InvalidBundleId: 'invalid-bundle-id',
    InvalidProductId: 'invalid-product-id',
    UserNotFound: 'user-not-found',
    PurchaseIsAlreadyUsed: 'purchase-is-already-used',
    TemporaryError: 'temporary-error',
    Unknown: 'unknown'
} as const;
export type IOSBatteryPurchaseStatusTransactionsInnerErrorCodeEnum = typeof IOSBatteryPurchaseStatusTransactionsInnerErrorCodeEnum[keyof typeof IOSBatteryPurchaseStatusTransactionsInnerErrorCodeEnum];


/**
 * Check if a given object implements the IOSBatteryPurchaseStatusTransactionsInnerError interface.
 */
export function instanceOfIOSBatteryPurchaseStatusTransactionsInnerError(value: object): value is IOSBatteryPurchaseStatusTransactionsInnerError {
    if (!('msg' in value) || value['msg'] === undefined) return false;
    if (!('code' in value) || value['code'] === undefined) return false;
    return true;
}

export function IOSBatteryPurchaseStatusTransactionsInnerErrorFromJSON(json: any): IOSBatteryPurchaseStatusTransactionsInnerError {
    return IOSBatteryPurchaseStatusTransactionsInnerErrorFromJSONTyped(json, false);
}

export function IOSBatteryPurchaseStatusTransactionsInnerErrorFromJSONTyped(json: any, ignoreDiscriminator: boolean): IOSBatteryPurchaseStatusTransactionsInnerError {
    if (json == null) {
        return json;
    }
    return {
        
        'msg': json['msg'],
        'code': json['code'],
    };
}

  export function IOSBatteryPurchaseStatusTransactionsInnerErrorToJSON(json: any): IOSBatteryPurchaseStatusTransactionsInnerError {
      return IOSBatteryPurchaseStatusTransactionsInnerErrorToJSONTyped(json, false);
  }

  export function IOSBatteryPurchaseStatusTransactionsInnerErrorToJSONTyped(value?: IOSBatteryPurchaseStatusTransactionsInnerError | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'msg': value['msg'],
        'code': value['code'],
    };
}

