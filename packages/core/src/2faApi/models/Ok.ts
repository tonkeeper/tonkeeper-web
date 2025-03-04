/* tslint:disable */
/* eslint-disable */
/**
 * REST API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.0.1
 * Contact: contact@tonaps.org
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface Ok
 */
export interface Ok {
    /**
     * 
     * @type {boolean}
     * @memberof Ok
     */
    ok: boolean;
}

/**
 * Check if a given object implements the Ok interface.
 */
export function instanceOfOk(value: object): value is Ok {
    if (!('ok' in value) || value['ok'] === undefined) return false;
    return true;
}

export function OkFromJSON(json: any): Ok {
    return OkFromJSONTyped(json, false);
}

export function OkFromJSONTyped(json: any, ignoreDiscriminator: boolean): Ok {
    if (json == null) {
        return json;
    }
    return {
        
        'ok': json['ok'],
    };
}

  export function OkToJSON(json: any): Ok {
      return OkToJSONTyped(json, false);
  }

  export function OkToJSONTyped(value?: Ok | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'ok': value['ok'],
    };
}

