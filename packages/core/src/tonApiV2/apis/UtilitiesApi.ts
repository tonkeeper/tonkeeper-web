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
  AddressParse200Response,
  GetOpenapiJsonDefaultResponse,
  ServiceStatus,
} from '../models/index';
import {
    AddressParse200ResponseFromJSON,
    AddressParse200ResponseToJSON,
    GetOpenapiJsonDefaultResponseFromJSON,
    GetOpenapiJsonDefaultResponseToJSON,
    ServiceStatusFromJSON,
    ServiceStatusToJSON,
} from '../models/index';

export interface AddressParseRequest {
    accountId: string;
}

/**
 * UtilitiesApi - interface
 * 
 * @export
 * @interface UtilitiesApiInterface
 */
export interface UtilitiesApiInterface {
    /**
     * parse address and display in all formats
     * @param {string} accountId account ID
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UtilitiesApiInterface
     */
    addressParseRaw(requestParameters: AddressParseRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AddressParse200Response>>;

    /**
     * parse address and display in all formats
     */
    addressParse(requestParameters: AddressParseRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AddressParse200Response>;

    /**
     * Get the openapi.json file
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UtilitiesApiInterface
     */
    getOpenapiJsonRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<any>>;

    /**
     * Get the openapi.json file
     */
    getOpenapiJson(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<any>;

    /**
     * Get the openapi.yml file
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UtilitiesApiInterface
     */
    getOpenapiYmlRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Blob>>;

    /**
     * Get the openapi.yml file
     */
    getOpenapiYml(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Blob>;

    /**
     * Status
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof UtilitiesApiInterface
     */
    statusRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ServiceStatus>>;

    /**
     * Status
     */
    status(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ServiceStatus>;

}

/**
 * 
 */
export class UtilitiesApi extends runtime.BaseAPI implements UtilitiesApiInterface {

    /**
     * parse address and display in all formats
     */
    async addressParseRaw(requestParameters: AddressParseRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AddressParse200Response>> {
        if (requestParameters['accountId'] == null) {
            throw new runtime.RequiredError(
                'accountId',
                'Required parameter "accountId" was null or undefined when calling addressParse().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/v2/address/{account_id}/parse`.replace(`{${"account_id"}}`, encodeURIComponent(String(requestParameters['accountId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AddressParse200ResponseFromJSON(jsonValue));
    }

    /**
     * parse address and display in all formats
     */
    async addressParse(requestParameters: AddressParseRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AddressParse200Response> {
        const response = await this.addressParseRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Get the openapi.json file
     */
    async getOpenapiJsonRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<any>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/v2/openapi.json`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        if (this.isJsonMime(response.headers.get('content-type'))) {
            return new runtime.JSONApiResponse<any>(response);
        } else {
            return new runtime.TextApiResponse(response) as any;
        }
    }

    /**
     * Get the openapi.json file
     */
    async getOpenapiJson(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<any> {
        const response = await this.getOpenapiJsonRaw(initOverrides);
        return await response.value();
    }

    /**
     * Get the openapi.yml file
     */
    async getOpenapiYmlRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Blob>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/v2/openapi.yml`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.BlobApiResponse(response);
    }

    /**
     * Get the openapi.yml file
     */
    async getOpenapiYml(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Blob> {
        const response = await this.getOpenapiYmlRaw(initOverrides);
        return await response.value();
    }

    /**
     * Status
     */
    async statusRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ServiceStatus>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/v2/status`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ServiceStatusFromJSON(jsonValue));
    }

    /**
     * Status
     */
    async status(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ServiceStatus> {
        const response = await this.statusRaw(initOverrides);
        return await response.value();
    }

}
