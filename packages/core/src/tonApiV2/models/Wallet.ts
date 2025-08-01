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
import type { AccountStatus } from './AccountStatus';
import {
    AccountStatusFromJSON,
    AccountStatusFromJSONTyped,
    AccountStatusToJSON,
    AccountStatusToJSONTyped,
} from './AccountStatus';
import type { WalletPlugin } from './WalletPlugin';
import {
    WalletPluginFromJSON,
    WalletPluginFromJSONTyped,
    WalletPluginToJSON,
    WalletPluginToJSONTyped,
} from './WalletPlugin';
import type { WalletStats } from './WalletStats';
import {
    WalletStatsFromJSON,
    WalletStatsFromJSONTyped,
    WalletStatsToJSON,
    WalletStatsToJSONTyped,
} from './WalletStats';

/**
 * 
 * @export
 * @interface Wallet
 */
export interface Wallet {
    /**
     * 
     * @type {string}
     * @memberof Wallet
     */
    address: string;
    /**
     * 
     * @type {boolean}
     * @memberof Wallet
     */
    isWallet: boolean;
    /**
     * 
     * @type {number}
     * @memberof Wallet
     */
    balance: number;
    /**
     * 
     * @type {WalletStats}
     * @memberof Wallet
     */
    stats: WalletStats;
    /**
     * 
     * @type {Array<WalletPlugin>}
     * @memberof Wallet
     */
    plugins: Array<WalletPlugin>;
    /**
     * 
     * @type {AccountStatus}
     * @memberof Wallet
     */
    status: AccountStatus;
    /**
     * unix timestamp
     * @type {number}
     * @memberof Wallet
     */
    lastActivity: number;
    /**
     * 
     * @type {string}
     * @memberof Wallet
     */
    name?: string;
    /**
     * 
     * @type {string}
     * @memberof Wallet
     */
    icon?: string;
    /**
     * 
     * @type {Array<string>}
     * @memberof Wallet
     * @deprecated
     */
    getMethods: Array<string>;
    /**
     * 
     * @type {boolean}
     * @memberof Wallet
     */
    isSuspended?: boolean;
    /**
     * 
     * @type {boolean}
     * @memberof Wallet
     */
    signatureDisabled?: boolean;
    /**
     * 
     * @type {Array<string>}
     * @memberof Wallet
     */
    interfaces?: Array<string>;
    /**
     * 
     * @type {number}
     * @memberof Wallet
     */
    lastLt: number;
}



/**
 * Check if a given object implements the Wallet interface.
 */
export function instanceOfWallet(value: object): value is Wallet {
    if (!('address' in value) || value['address'] === undefined) return false;
    if (!('isWallet' in value) || value['isWallet'] === undefined) return false;
    if (!('balance' in value) || value['balance'] === undefined) return false;
    if (!('stats' in value) || value['stats'] === undefined) return false;
    if (!('plugins' in value) || value['plugins'] === undefined) return false;
    if (!('status' in value) || value['status'] === undefined) return false;
    if (!('lastActivity' in value) || value['lastActivity'] === undefined) return false;
    if (!('getMethods' in value) || value['getMethods'] === undefined) return false;
    if (!('lastLt' in value) || value['lastLt'] === undefined) return false;
    return true;
}

export function WalletFromJSON(json: any): Wallet {
    return WalletFromJSONTyped(json, false);
}

export function WalletFromJSONTyped(json: any, ignoreDiscriminator: boolean): Wallet {
    if (json == null) {
        return json;
    }
    return {
        
        'address': json['address'],
        'isWallet': json['is_wallet'],
        'balance': json['balance'],
        'stats': WalletStatsFromJSON(json['stats']),
        'plugins': ((json['plugins'] as Array<any>).map(WalletPluginFromJSON)),
        'status': AccountStatusFromJSON(json['status']),
        'lastActivity': json['last_activity'],
        'name': json['name'] == null ? undefined : json['name'],
        'icon': json['icon'] == null ? undefined : json['icon'],
        'getMethods': json['get_methods'],
        'isSuspended': json['is_suspended'] == null ? undefined : json['is_suspended'],
        'signatureDisabled': json['signature_disabled'] == null ? undefined : json['signature_disabled'],
        'interfaces': json['interfaces'] == null ? undefined : json['interfaces'],
        'lastLt': json['last_lt'],
    };
}

  export function WalletToJSON(json: any): Wallet {
      return WalletToJSONTyped(json, false);
  }

  export function WalletToJSONTyped(value?: Wallet | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'address': value['address'],
        'is_wallet': value['isWallet'],
        'balance': value['balance'],
        'stats': WalletStatsToJSON(value['stats']),
        'plugins': ((value['plugins'] as Array<any>).map(WalletPluginToJSON)),
        'status': AccountStatusToJSON(value['status']),
        'last_activity': value['lastActivity'],
        'name': value['name'],
        'icon': value['icon'],
        'get_methods': value['getMethods'],
        'is_suspended': value['isSuspended'],
        'signature_disabled': value['signatureDisabled'],
        'interfaces': value['interfaces'],
        'last_lt': value['lastLt'],
    };
}

