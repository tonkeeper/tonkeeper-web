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


/**
 * 
 * @export
 */
export const CurrencyType = {
    Native: 'native',
    ExtraCurrency: 'extra_currency',
    Jetton: 'jetton',
    Fiat: 'fiat'
} as const;
export type CurrencyType = typeof CurrencyType[keyof typeof CurrencyType];


export function instanceOfCurrencyType(value: any): boolean {
    for (const key in CurrencyType) {
        if (Object.prototype.hasOwnProperty.call(CurrencyType, key)) {
            if (CurrencyType[key as keyof typeof CurrencyType] === value) {
                return true;
            }
        }
    }
    return false;
}

export function CurrencyTypeFromJSON(json: any): CurrencyType {
    return CurrencyTypeFromJSONTyped(json, false);
}

export function CurrencyTypeFromJSONTyped(json: any, ignoreDiscriminator: boolean): CurrencyType {
    return json as CurrencyType;
}

export function CurrencyTypeToJSON(value?: CurrencyType | null): any {
    return value as any;
}

export function CurrencyTypeToJSONTyped(value: any, ignoreDiscriminator: boolean): CurrencyType {
    return value as CurrencyType;
}

