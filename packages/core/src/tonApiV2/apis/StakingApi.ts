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
  AccountStaking,
  GetOpenapiJsonDefaultResponse,
  GetStakingPoolHistory200Response,
  GetStakingPoolInfo200Response,
  GetStakingPools200Response,
} from '../models/index';
import {
    AccountStakingFromJSON,
    AccountStakingToJSON,
    GetOpenapiJsonDefaultResponseFromJSON,
    GetOpenapiJsonDefaultResponseToJSON,
    GetStakingPoolHistory200ResponseFromJSON,
    GetStakingPoolHistory200ResponseToJSON,
    GetStakingPoolInfo200ResponseFromJSON,
    GetStakingPoolInfo200ResponseToJSON,
    GetStakingPools200ResponseFromJSON,
    GetStakingPools200ResponseToJSON,
} from '../models/index';

export interface GetAccountNominatorsPoolsRequest {
    accountId: string;
}

export interface GetStakingPoolHistoryRequest {
    accountId: string;
}

export interface GetStakingPoolInfoRequest {
    accountId: string;
    acceptLanguage?: string;
}

export interface GetStakingPoolsRequest {
    availableFor?: string;
    includeUnverified?: boolean;
    acceptLanguage?: string;
}

/**
 * StakingApi - interface
 * 
 * @export
 * @interface StakingApiInterface
 */
export interface StakingApiInterface {
    /**
     * All pools where account participates
     * @param {string} accountId account ID
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof StakingApiInterface
     */
    getAccountNominatorsPoolsRaw(requestParameters: GetAccountNominatorsPoolsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AccountStaking>>;

    /**
     * All pools where account participates
     */
    getAccountNominatorsPools(requestParameters: GetAccountNominatorsPoolsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AccountStaking>;

    /**
     * Pool history
     * @param {string} accountId account ID
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof StakingApiInterface
     */
    getStakingPoolHistoryRaw(requestParameters: GetStakingPoolHistoryRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetStakingPoolHistory200Response>>;

    /**
     * Pool history
     */
    getStakingPoolHistory(requestParameters: GetStakingPoolHistoryRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetStakingPoolHistory200Response>;

    /**
     * Stacking pool info
     * @param {string} accountId account ID
     * @param {string} [acceptLanguage] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof StakingApiInterface
     */
    getStakingPoolInfoRaw(requestParameters: GetStakingPoolInfoRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetStakingPoolInfo200Response>>;

    /**
     * Stacking pool info
     */
    getStakingPoolInfo(requestParameters: GetStakingPoolInfoRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetStakingPoolInfo200Response>;

    /**
     * All pools available in network
     * @param {string} [availableFor] account ID
     * @param {boolean} [includeUnverified] return also pools not from white list - just compatible by interfaces (maybe dangerous!)
     * @param {string} [acceptLanguage] 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof StakingApiInterface
     */
    getStakingPoolsRaw(requestParameters: GetStakingPoolsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetStakingPools200Response>>;

    /**
     * All pools available in network
     */
    getStakingPools(requestParameters: GetStakingPoolsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetStakingPools200Response>;

}

/**
 * 
 */
export class StakingApi extends runtime.BaseAPI implements StakingApiInterface {

    /**
     * All pools where account participates
     */
    async getAccountNominatorsPoolsRaw(requestParameters: GetAccountNominatorsPoolsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AccountStaking>> {
        if (requestParameters['accountId'] == null) {
            throw new runtime.RequiredError(
                'accountId',
                'Required parameter "accountId" was null or undefined when calling getAccountNominatorsPools().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/v2/staking/nominator/{account_id}/pools`.replace(`{${"account_id"}}`, encodeURIComponent(String(requestParameters['accountId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AccountStakingFromJSON(jsonValue));
    }

    /**
     * All pools where account participates
     */
    async getAccountNominatorsPools(requestParameters: GetAccountNominatorsPoolsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AccountStaking> {
        const response = await this.getAccountNominatorsPoolsRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Pool history
     */
    async getStakingPoolHistoryRaw(requestParameters: GetStakingPoolHistoryRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetStakingPoolHistory200Response>> {
        if (requestParameters['accountId'] == null) {
            throw new runtime.RequiredError(
                'accountId',
                'Required parameter "accountId" was null or undefined when calling getStakingPoolHistory().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/v2/staking/pool/{account_id}/history`.replace(`{${"account_id"}}`, encodeURIComponent(String(requestParameters['accountId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => GetStakingPoolHistory200ResponseFromJSON(jsonValue));
    }

    /**
     * Pool history
     */
    async getStakingPoolHistory(requestParameters: GetStakingPoolHistoryRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetStakingPoolHistory200Response> {
        const response = await this.getStakingPoolHistoryRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Stacking pool info
     */
    async getStakingPoolInfoRaw(requestParameters: GetStakingPoolInfoRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetStakingPoolInfo200Response>> {
        if (requestParameters['accountId'] == null) {
            throw new runtime.RequiredError(
                'accountId',
                'Required parameter "accountId" was null or undefined when calling getStakingPoolInfo().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (requestParameters['acceptLanguage'] != null) {
            headerParameters['Accept-Language'] = String(requestParameters['acceptLanguage']);
        }

        const response = await this.request({
            path: `/v2/staking/pool/{account_id}`.replace(`{${"account_id"}}`, encodeURIComponent(String(requestParameters['accountId']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => GetStakingPoolInfo200ResponseFromJSON(jsonValue));
    }

    /**
     * Stacking pool info
     */
    async getStakingPoolInfo(requestParameters: GetStakingPoolInfoRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetStakingPoolInfo200Response> {
        const response = await this.getStakingPoolInfoRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * All pools available in network
     */
    async getStakingPoolsRaw(requestParameters: GetStakingPoolsRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetStakingPools200Response>> {
        const queryParameters: any = {};

        if (requestParameters['availableFor'] != null) {
            queryParameters['available_for'] = requestParameters['availableFor'];
        }

        if (requestParameters['includeUnverified'] != null) {
            queryParameters['include_unverified'] = requestParameters['includeUnverified'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        if (requestParameters['acceptLanguage'] != null) {
            headerParameters['Accept-Language'] = String(requestParameters['acceptLanguage']);
        }

        const response = await this.request({
            path: `/v2/staking/pools`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => GetStakingPools200ResponseFromJSON(jsonValue));
    }

    /**
     * All pools available in network
     */
    async getStakingPools(requestParameters: GetStakingPoolsRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetStakingPools200Response> {
        const response = await this.getStakingPoolsRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
