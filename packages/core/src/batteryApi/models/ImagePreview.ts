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
 * @interface ImagePreview
 */
export interface ImagePreview {
    /**
     * 
     * @type {string}
     * @memberof ImagePreview
     */
    resolution: string;
    /**
     * 
     * @type {string}
     * @memberof ImagePreview
     */
    url: string;
}

/**
 * Check if a given object implements the ImagePreview interface.
 */
export function instanceOfImagePreview(value: object): value is ImagePreview {
    if (!('resolution' in value) || value['resolution'] === undefined) return false;
    if (!('url' in value) || value['url'] === undefined) return false;
    return true;
}

export function ImagePreviewFromJSON(json: any): ImagePreview {
    return ImagePreviewFromJSONTyped(json, false);
}

export function ImagePreviewFromJSONTyped(json: any, ignoreDiscriminator: boolean): ImagePreview {
    if (json == null) {
        return json;
    }
    return {
        
        'resolution': json['resolution'],
        'url': json['url'],
    };
}

  export function ImagePreviewToJSON(json: any): ImagePreview {
      return ImagePreviewToJSONTyped(json, false);
  }

  export function ImagePreviewToJSONTyped(value?: ImagePreview | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'resolution': value['resolution'],
        'url': value['url'],
    };
}

