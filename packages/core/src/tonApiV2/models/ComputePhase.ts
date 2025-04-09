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
import type { ComputeSkipReason } from './ComputeSkipReason';
import {
    ComputeSkipReasonFromJSON,
    ComputeSkipReasonFromJSONTyped,
    ComputeSkipReasonToJSON,
    ComputeSkipReasonToJSONTyped,
} from './ComputeSkipReason';

/**
 * 
 * @export
 * @interface ComputePhase
 */
export interface ComputePhase {
    /**
     * 
     * @type {boolean}
     * @memberof ComputePhase
     */
    skipped: boolean;
    /**
     * 
     * @type {ComputeSkipReason}
     * @memberof ComputePhase
     */
    skipReason?: ComputeSkipReason;
    /**
     * 
     * @type {boolean}
     * @memberof ComputePhase
     */
    success?: boolean;
    /**
     * 
     * @type {number}
     * @memberof ComputePhase
     */
    gasFees?: number;
    /**
     * 
     * @type {number}
     * @memberof ComputePhase
     */
    gasUsed?: number;
    /**
     * 
     * @type {number}
     * @memberof ComputePhase
     */
    vmSteps?: number;
    /**
     * 
     * @type {number}
     * @memberof ComputePhase
     */
    exitCode?: number;
    /**
     * 
     * @type {string}
     * @memberof ComputePhase
     */
    exitCodeDescription?: string;
}



/**
 * Check if a given object implements the ComputePhase interface.
 */
export function instanceOfComputePhase(value: object): value is ComputePhase {
    if (!('skipped' in value) || value['skipped'] === undefined) return false;
    return true;
}

export function ComputePhaseFromJSON(json: any): ComputePhase {
    return ComputePhaseFromJSONTyped(json, false);
}

export function ComputePhaseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ComputePhase {
    if (json == null) {
        return json;
    }
    return {
        
        'skipped': json['skipped'],
        'skipReason': json['skip_reason'] == null ? undefined : ComputeSkipReasonFromJSON(json['skip_reason']),
        'success': json['success'] == null ? undefined : json['success'],
        'gasFees': json['gas_fees'] == null ? undefined : json['gas_fees'],
        'gasUsed': json['gas_used'] == null ? undefined : json['gas_used'],
        'vmSteps': json['vm_steps'] == null ? undefined : json['vm_steps'],
        'exitCode': json['exit_code'] == null ? undefined : json['exit_code'],
        'exitCodeDescription': json['exit_code_description'] == null ? undefined : json['exit_code_description'],
    };
}

export function ComputePhaseToJSON(json: any): ComputePhase {
    return ComputePhaseToJSONTyped(json, false);
}

export function ComputePhaseToJSONTyped(value?: ComputePhase | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'skipped': value['skipped'],
        'skip_reason': ComputeSkipReasonToJSON(value['skipReason']),
        'success': value['success'],
        'gas_fees': value['gasFees'],
        'gas_used': value['gasUsed'],
        'vm_steps': value['vmSteps'],
        'exit_code': value['exitCode'],
        'exit_code_description': value['exitCodeDescription'],
    };
}

