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
import type { CreatePromoCampaignRequestParticipantsInner } from './CreatePromoCampaignRequestParticipantsInner';
import {
    CreatePromoCampaignRequestParticipantsInnerFromJSON,
    CreatePromoCampaignRequestParticipantsInnerFromJSONTyped,
    CreatePromoCampaignRequestParticipantsInnerToJSON,
    CreatePromoCampaignRequestParticipantsInnerToJSONTyped,
} from './CreatePromoCampaignRequestParticipantsInner';

/**
 * 
 * @export
 * @interface CreatePromoCampaignRequest
 */
export interface CreatePromoCampaignRequest {
    /**
     * 
     * @type {string}
     * @memberof CreatePromoCampaignRequest
     */
    name: string;
    /**
     * 
     * @type {Array<CreatePromoCampaignRequestParticipantsInner>}
     * @memberof CreatePromoCampaignRequest
     */
    participants: Array<CreatePromoCampaignRequestParticipantsInner>;
}

/**
 * Check if a given object implements the CreatePromoCampaignRequest interface.
 */
export function instanceOfCreatePromoCampaignRequest(value: object): value is CreatePromoCampaignRequest {
    if (!('name' in value) || value['name'] === undefined) return false;
    if (!('participants' in value) || value['participants'] === undefined) return false;
    return true;
}

export function CreatePromoCampaignRequestFromJSON(json: any): CreatePromoCampaignRequest {
    return CreatePromoCampaignRequestFromJSONTyped(json, false);
}

export function CreatePromoCampaignRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreatePromoCampaignRequest {
    if (json == null) {
        return json;
    }
    return {
        
        'name': json['name'],
        'participants': ((json['participants'] as Array<any>).map(CreatePromoCampaignRequestParticipantsInnerFromJSON)),
    };
}

  export function CreatePromoCampaignRequestToJSON(json: any): CreatePromoCampaignRequest {
      return CreatePromoCampaignRequestToJSONTyped(json, false);
  }

  export function CreatePromoCampaignRequestToJSONTyped(value?: CreatePromoCampaignRequest | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'name': value['name'],
        'participants': ((value['participants'] as Array<any>).map(CreatePromoCampaignRequestParticipantsInnerToJSON)),
    };
}

