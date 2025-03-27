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


import * as runtime from '../runtime';
import type {
  GaslessConfig,
  GaslessEstimateRequest,
  GaslessSendRequest,
  GaslessTx,
  SignRawParams,
} from '../models/index';
import {
    GaslessConfigFromJSON,
    GaslessConfigToJSON,
    GaslessEstimateRequestFromJSON,
    GaslessEstimateRequestToJSON,
    GaslessSendRequestFromJSON,
    GaslessSendRequestToJSON,
    GaslessTxFromJSON,
    GaslessTxToJSON,
    SignRawParamsFromJSON,
    SignRawParamsToJSON,
} from '../models/index';

export interface GaslessEstimateOperationRequest {
    masterId: string;
    gaslessEstimateRequest: GaslessEstimateRequest;
    acceptLanguage?: string;
}

export interface GaslessSendOperationRequest {
    gaslessSendRequest: GaslessSendRequest;
}

/**
 * GaslessApi - interface
 * 
 * @export
 * @interface GaslessApiInterface
 */
export interface GaslessApiInterface {
    /**
     * Returns configuration of gasless transfers
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof GaslessApiInterface
     */
    gaslessConfigRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GaslessConfig>>;

    /**
     * Returns configuration of gasless transfers
     */
    gaslessConfig(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GaslessConfig>;

    /**
     * Estimates the cost of the given messages and returns a payload to sign
     * @param {string} masterId jetton to pay commission
     * @param {GaslessEstimateRequest} gaslessEstimateRequest bag-of-cells serialized to hex
     * @param {string} [acceptLanguage] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof GaslessApiInterface
     */
    gaslessEstimateRaw(requestParameters: GaslessEstimateOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SignRawParams>>;

    /**
     * Estimates the cost of the given messages and returns a payload to sign
     */
    gaslessEstimate(requestParameters: GaslessEstimateOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SignRawParams>;

    /**
     * Submits the signed gasless transaction message to the network
     * @param {GaslessSendRequest} gaslessSendRequest bag-of-cells serialized to hex
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof GaslessApiInterface
     */
    gaslessSendRaw(requestParameters: GaslessSendOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GaslessTx>>;

    /**
     * Submits the signed gasless transaction message to the network
     */
    gaslessSend(requestParameters: GaslessSendOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GaslessTx>;

}

/**
 * 
 */
export class GaslessApi extends runtime.BaseAPI implements GaslessApiInterface {

    /**
     * Returns configuration of gasless transfers
     */
    async gaslessConfigRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GaslessConfig>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/v2/gasless/config`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => GaslessConfigFromJSON(jsonValue));
    }

    /**
     * Returns configuration of gasless transfers
     */
    async gaslessConfig(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GaslessConfig> {
        const response = await this.gaslessConfigRaw(initOverrides);
        return await response.value();
    }

    /**
     * Estimates the cost of the given messages and returns a payload to sign
     */
    async gaslessEstimateRaw(requestParameters: GaslessEstimateOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<SignRawParams>> {
        if (requestParameters['masterId'] == null) {
            throw new runtime.RequiredError(
                'masterId',
                'Required parameter "masterId" was null or undefined when calling gaslessEstimate().'
            );
        }

        if (requestParameters['gaslessEstimateRequest'] == null) {
            throw new runtime.RequiredError(
                'gaslessEstimateRequest',
                'Required parameter "gaslessEstimateRequest" was null or undefined when calling gaslessEstimate().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        if (requestParameters['acceptLanguage'] != null) {
            headerParameters['Accept-Language'] = String(requestParameters['acceptLanguage']);
        }

        const response = await this.request({
            path: `/v2/gasless/estimate/{master_id}`.replace(`{${"master_id"}}`, encodeURIComponent(String(requestParameters['masterId']))),
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: GaslessEstimateRequestToJSON(requestParameters['gaslessEstimateRequest']),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => SignRawParamsFromJSON(jsonValue));
    }

    /**
     * Estimates the cost of the given messages and returns a payload to sign
     */
    async gaslessEstimate(requestParameters: GaslessEstimateOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<SignRawParams> {
        const response = await this.gaslessEstimateRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Submits the signed gasless transaction message to the network
     */
    async gaslessSendRaw(requestParameters: GaslessSendOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GaslessTx>> {
        if (requestParameters['gaslessSendRequest'] == null) {
            throw new runtime.RequiredError(
                'gaslessSendRequest',
                'Required parameter "gaslessSendRequest" was null or undefined when calling gaslessSend().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/v2/gasless/send`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: GaslessSendRequestToJSON(requestParameters['gaslessSendRequest']),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => GaslessTxFromJSON(jsonValue));
    }

    /**
     * Submits the signed gasless transaction message to the network
     */
    async gaslessSend(requestParameters: GaslessSendOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GaslessTx> {
        const response = await this.gaslessSendRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
