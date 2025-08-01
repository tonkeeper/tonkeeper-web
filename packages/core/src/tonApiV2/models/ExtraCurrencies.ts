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
import type { EcPreview } from './EcPreview';
import {
    EcPreviewFromJSON,
    EcPreviewFromJSONTyped,
    EcPreviewToJSON,
    EcPreviewToJSONTyped,
} from './EcPreview';

/**
 * 
 * @export
 * @interface ExtraCurrencies
 */
export interface ExtraCurrencies {
    /**
     * 
     * @type {Array<EcPreview>}
     * @memberof ExtraCurrencies
     */
    extraCurrencies: Array<EcPreview>;
}

/**
 * Check if a given object implements the ExtraCurrencies interface.
 */
export function instanceOfExtraCurrencies(value: object): value is ExtraCurrencies {
    if (!('extraCurrencies' in value) || value['extraCurrencies'] === undefined) return false;
    return true;
}

export function ExtraCurrenciesFromJSON(json: any): ExtraCurrencies {
    return ExtraCurrenciesFromJSONTyped(json, false);
}

export function ExtraCurrenciesFromJSONTyped(json: any, ignoreDiscriminator: boolean): ExtraCurrencies {
    if (json == null) {
        return json;
    }
    return {
        
        'extraCurrencies': ((json['extra_currencies'] as Array<any>).map(EcPreviewFromJSON)),
    };
}

  export function ExtraCurrenciesToJSON(json: any): ExtraCurrencies {
      return ExtraCurrenciesToJSONTyped(json, false);
  }

  export function ExtraCurrenciesToJSONTyped(value?: ExtraCurrencies | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'extra_currencies': ((value['extraCurrencies'] as Array<any>).map(EcPreviewToJSON)),
    };
}

