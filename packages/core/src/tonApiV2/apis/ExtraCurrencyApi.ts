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
  EcPreview,
  InlineObject,
} from '../models/index';
import {
    EcPreviewFromJSON,
    EcPreviewToJSON,
    InlineObjectFromJSON,
    InlineObjectToJSON,
} from '../models/index';

export interface GetExtraCurrencyInfoRequest {
    id: number;
}

/**
 * ExtraCurrencyApi - interface
 * 
 * @export
 * @interface ExtraCurrencyApiInterface
 */
export interface ExtraCurrencyApiInterface {
    /**
     * Get extra currency info by id
     * @param {number} id extra currency id
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ExtraCurrencyApiInterface
     */
    getExtraCurrencyInfoRaw(requestParameters: GetExtraCurrencyInfoRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<EcPreview>>;

    /**
     * Get extra currency info by id
     */
    getExtraCurrencyInfo(requestParameters: GetExtraCurrencyInfoRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<EcPreview>;

}

/**
 * 
 */
export class ExtraCurrencyApi extends runtime.BaseAPI implements ExtraCurrencyApiInterface {

    /**
     * Get extra currency info by id
     */
    async getExtraCurrencyInfoRaw(requestParameters: GetExtraCurrencyInfoRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<EcPreview>> {
        if (requestParameters['id'] == null) {
            throw new runtime.RequiredError(
                'id',
                'Required parameter "id" was null or undefined when calling getExtraCurrencyInfo().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/v2/extra-currency/{id}`.replace(`{${"id"}}`, encodeURIComponent(String(requestParameters['id']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => EcPreviewFromJSON(jsonValue));
    }

    /**
     * Get extra currency info by id
     */
    async getExtraCurrencyInfo(requestParameters: GetExtraCurrencyInfoRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<EcPreview> {
        const response = await this.getExtraCurrencyInfoRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
