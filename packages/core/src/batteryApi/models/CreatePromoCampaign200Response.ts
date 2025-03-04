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
import type { CreatePromoCampaign200ResponseParticipantsInner } from './CreatePromoCampaign200ResponseParticipantsInner';
import {
    CreatePromoCampaign200ResponseParticipantsInnerFromJSON,
    CreatePromoCampaign200ResponseParticipantsInnerFromJSONTyped,
    CreatePromoCampaign200ResponseParticipantsInnerToJSON,
    CreatePromoCampaign200ResponseParticipantsInnerToJSONTyped,
} from './CreatePromoCampaign200ResponseParticipantsInner';

/**
 * 
 * @export
 * @interface CreatePromoCampaign200Response
 */
export interface CreatePromoCampaign200Response {
    /**
     * 
     * @type {Array<CreatePromoCampaign200ResponseParticipantsInner>}
     * @memberof CreatePromoCampaign200Response
     */
    participants: Array<CreatePromoCampaign200ResponseParticipantsInner>;
}

/**
 * Check if a given object implements the CreatePromoCampaign200Response interface.
 */
export function instanceOfCreatePromoCampaign200Response(value: object): value is CreatePromoCampaign200Response {
    if (!('participants' in value) || value['participants'] === undefined) return false;
    return true;
}

export function CreatePromoCampaign200ResponseFromJSON(json: any): CreatePromoCampaign200Response {
    return CreatePromoCampaign200ResponseFromJSONTyped(json, false);
}

export function CreatePromoCampaign200ResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreatePromoCampaign200Response {
    if (json == null) {
        return json;
    }
    return {
        
        'participants': ((json['participants'] as Array<any>).map(CreatePromoCampaign200ResponseParticipantsInnerFromJSON)),
    };
}

  export function CreatePromoCampaign200ResponseToJSON(json: any): CreatePromoCampaign200Response {
      return CreatePromoCampaign200ResponseToJSONTyped(json, false);
  }

  export function CreatePromoCampaign200ResponseToJSONTyped(value?: CreatePromoCampaign200Response | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'participants': ((value['participants'] as Array<any>).map(CreatePromoCampaign200ResponseParticipantsInnerToJSON)),
    };
}

