/* tslint:disable */
/* eslint-disable */
/**
 * Tonkeeper TWA API.
 * REST API for Tonkeeper TWA.
 *
 * The version of the OpenAPI document: 0.0.1
 * Contact: support@tonkeeper.com
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */


import * as runtime from '../runtime';
import type {
  AccountEventsSubscriptionStatus200Response,
  AccountEventsSubscriptionStatusRequest,
  BridgeWebhookRequest,
  GetTonConnectPayload200Response,
  GetTonConnectPayloadDefaultResponse,
  SubscribeToAccountEventsRequest,
  SubscribeToBridgeEventsRequest,
  UnsubscribeFromAccountEventsRequest,
  UnsubscribeFromBridgeEventsRequest,
} from '../models/index';
import {
    AccountEventsSubscriptionStatus200ResponseFromJSON,
    AccountEventsSubscriptionStatus200ResponseToJSON,
    AccountEventsSubscriptionStatusRequestFromJSON,
    AccountEventsSubscriptionStatusRequestToJSON,
    BridgeWebhookRequestFromJSON,
    BridgeWebhookRequestToJSON,
    GetTonConnectPayload200ResponseFromJSON,
    GetTonConnectPayload200ResponseToJSON,
    GetTonConnectPayloadDefaultResponseFromJSON,
    GetTonConnectPayloadDefaultResponseToJSON,
    SubscribeToAccountEventsRequestFromJSON,
    SubscribeToAccountEventsRequestToJSON,
    SubscribeToBridgeEventsRequestFromJSON,
    SubscribeToBridgeEventsRequestToJSON,
    UnsubscribeFromAccountEventsRequestFromJSON,
    UnsubscribeFromAccountEventsRequestToJSON,
    UnsubscribeFromBridgeEventsRequestFromJSON,
    UnsubscribeFromBridgeEventsRequestToJSON,
} from '../models/index';

export interface AccountEventsSubscriptionStatusOperationRequest {
    accountEventsSubscriptionStatusRequest: AccountEventsSubscriptionStatusRequest;
}

export interface BridgeWebhookOperationRequest {
    clientId: string;
    bridgeWebhookRequest: BridgeWebhookRequest;
}

export interface SubscribeToAccountEventsOperationRequest {
    subscribeToAccountEventsRequest: SubscribeToAccountEventsRequest;
}

export interface SubscribeToBridgeEventsOperationRequest {
    subscribeToBridgeEventsRequest: SubscribeToBridgeEventsRequest;
}

export interface UnsubscribeFromAccountEventsOperationRequest {
    unsubscribeFromAccountEventsRequest: UnsubscribeFromAccountEventsRequest;
}

export interface UnsubscribeFromBridgeEventsOperationRequest {
    unsubscribeFromBridgeEventsRequest: UnsubscribeFromBridgeEventsRequest;
}

/**
 * DefaultApi - interface
 * 
 * @export
 * @interface DefaultApiInterface
 */
export interface DefaultApiInterface {
    /**
     * Get a status of account events subscription.
     * @param {AccountEventsSubscriptionStatusRequest} accountEventsSubscriptionStatusRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApiInterface
     */
    accountEventsSubscriptionStatusRaw(requestParameters: AccountEventsSubscriptionStatusOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AccountEventsSubscriptionStatus200Response>>;

    /**
     * Get a status of account events subscription.
     */
    accountEventsSubscriptionStatus(requestParameters: AccountEventsSubscriptionStatusOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AccountEventsSubscriptionStatus200Response>;

    /**
     * 
     * @param {string} clientId 
     * @param {BridgeWebhookRequest} bridgeWebhookRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApiInterface
     */
    bridgeWebhookRaw(requestParameters: BridgeWebhookOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>>;

    /**
     */
    bridgeWebhook(requestParameters: BridgeWebhookOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void>;

    /**
     * Get a challenge for TON Connect.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApiInterface
     */
    getTonConnectPayloadRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetTonConnectPayload200Response>>;

    /**
     * Get a challenge for TON Connect.
     */
    getTonConnectPayload(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetTonConnectPayload200Response>;

    /**
     * Subscribe to notifications about events in the TON blockchain for the specified address.
     * @param {SubscribeToAccountEventsRequest} subscribeToAccountEventsRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApiInterface
     */
    subscribeToAccountEventsRaw(requestParameters: SubscribeToAccountEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>>;

    /**
     * Subscribe to notifications about events in the TON blockchain for the specified address.
     */
    subscribeToAccountEvents(requestParameters: SubscribeToAccountEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void>;

    /**
     * Subscribe to notifications from the HTTP Bridge regarding a specific smart contract or wallet.
     * @param {SubscribeToBridgeEventsRequest} subscribeToBridgeEventsRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApiInterface
     */
    subscribeToBridgeEventsRaw(requestParameters: SubscribeToBridgeEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>>;

    /**
     * Subscribe to notifications from the HTTP Bridge regarding a specific smart contract or wallet.
     */
    subscribeToBridgeEvents(requestParameters: SubscribeToBridgeEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void>;

    /**
     * Unsubscribe from notifications about events in the TON blockchain for the specified address.
     * @param {UnsubscribeFromAccountEventsRequest} unsubscribeFromAccountEventsRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApiInterface
     */
    unsubscribeFromAccountEventsRaw(requestParameters: UnsubscribeFromAccountEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>>;

    /**
     * Unsubscribe from notifications about events in the TON blockchain for the specified address.
     */
    unsubscribeFromAccountEvents(requestParameters: UnsubscribeFromAccountEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void>;

    /**
     * Unsubscribe from bridge notifications.
     * @param {UnsubscribeFromBridgeEventsRequest} unsubscribeFromBridgeEventsRequest 
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DefaultApiInterface
     */
    unsubscribeFromBridgeEventsRaw(requestParameters: UnsubscribeFromBridgeEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>>;

    /**
     * Unsubscribe from bridge notifications.
     */
    unsubscribeFromBridgeEvents(requestParameters: UnsubscribeFromBridgeEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void>;

}

/**
 * 
 */
export class DefaultApi extends runtime.BaseAPI implements DefaultApiInterface {

    /**
     * Get a status of account events subscription.
     */
    async accountEventsSubscriptionStatusRaw(requestParameters: AccountEventsSubscriptionStatusOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<AccountEventsSubscriptionStatus200Response>> {
        if (requestParameters.accountEventsSubscriptionStatusRequest === null || requestParameters.accountEventsSubscriptionStatusRequest === undefined) {
            throw new runtime.RequiredError('accountEventsSubscriptionStatusRequest','Required parameter requestParameters.accountEventsSubscriptionStatusRequest was null or undefined when calling accountEventsSubscriptionStatus.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/account-events/subscription-status`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: AccountEventsSubscriptionStatusRequestToJSON(requestParameters.accountEventsSubscriptionStatusRequest),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => AccountEventsSubscriptionStatus200ResponseFromJSON(jsonValue));
    }

    /**
     * Get a status of account events subscription.
     */
    async accountEventsSubscriptionStatus(requestParameters: AccountEventsSubscriptionStatusOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<AccountEventsSubscriptionStatus200Response> {
        const response = await this.accountEventsSubscriptionStatusRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     */
    async bridgeWebhookRaw(requestParameters: BridgeWebhookOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.clientId === null || requestParameters.clientId === undefined) {
            throw new runtime.RequiredError('clientId','Required parameter requestParameters.clientId was null or undefined when calling bridgeWebhook.');
        }

        if (requestParameters.bridgeWebhookRequest === null || requestParameters.bridgeWebhookRequest === undefined) {
            throw new runtime.RequiredError('bridgeWebhookRequest','Required parameter requestParameters.bridgeWebhookRequest was null or undefined when calling bridgeWebhook.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/bridge/webhook/{client_id}`.replace(`{${"client_id"}}`, encodeURIComponent(String(requestParameters.clientId))),
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: BridgeWebhookRequestToJSON(requestParameters.bridgeWebhookRequest),
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     */
    async bridgeWebhook(requestParameters: BridgeWebhookOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.bridgeWebhookRaw(requestParameters, initOverrides);
    }

    /**
     * Get a challenge for TON Connect.
     */
    async getTonConnectPayloadRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<GetTonConnectPayload200Response>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/tonconnect/payload`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => GetTonConnectPayload200ResponseFromJSON(jsonValue));
    }

    /**
     * Get a challenge for TON Connect.
     */
    async getTonConnectPayload(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<GetTonConnectPayload200Response> {
        const response = await this.getTonConnectPayloadRaw(initOverrides);
        return await response.value();
    }

    /**
     * Subscribe to notifications about events in the TON blockchain for the specified address.
     */
    async subscribeToAccountEventsRaw(requestParameters: SubscribeToAccountEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.subscribeToAccountEventsRequest === null || requestParameters.subscribeToAccountEventsRequest === undefined) {
            throw new runtime.RequiredError('subscribeToAccountEventsRequest','Required parameter requestParameters.subscribeToAccountEventsRequest was null or undefined when calling subscribeToAccountEvents.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/account-events/subscribe`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: SubscribeToAccountEventsRequestToJSON(requestParameters.subscribeToAccountEventsRequest),
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Subscribe to notifications about events in the TON blockchain for the specified address.
     */
    async subscribeToAccountEvents(requestParameters: SubscribeToAccountEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.subscribeToAccountEventsRaw(requestParameters, initOverrides);
    }

    /**
     * Subscribe to notifications from the HTTP Bridge regarding a specific smart contract or wallet.
     */
    async subscribeToBridgeEventsRaw(requestParameters: SubscribeToBridgeEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.subscribeToBridgeEventsRequest === null || requestParameters.subscribeToBridgeEventsRequest === undefined) {
            throw new runtime.RequiredError('subscribeToBridgeEventsRequest','Required parameter requestParameters.subscribeToBridgeEventsRequest was null or undefined when calling subscribeToBridgeEvents.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/bridge/subscribe`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: SubscribeToBridgeEventsRequestToJSON(requestParameters.subscribeToBridgeEventsRequest),
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Subscribe to notifications from the HTTP Bridge regarding a specific smart contract or wallet.
     */
    async subscribeToBridgeEvents(requestParameters: SubscribeToBridgeEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.subscribeToBridgeEventsRaw(requestParameters, initOverrides);
    }

    /**
     * Unsubscribe from notifications about events in the TON blockchain for the specified address.
     */
    async unsubscribeFromAccountEventsRaw(requestParameters: UnsubscribeFromAccountEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.unsubscribeFromAccountEventsRequest === null || requestParameters.unsubscribeFromAccountEventsRequest === undefined) {
            throw new runtime.RequiredError('unsubscribeFromAccountEventsRequest','Required parameter requestParameters.unsubscribeFromAccountEventsRequest was null or undefined when calling unsubscribeFromAccountEvents.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/account-events/unsubscribe`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: UnsubscribeFromAccountEventsRequestToJSON(requestParameters.unsubscribeFromAccountEventsRequest),
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Unsubscribe from notifications about events in the TON blockchain for the specified address.
     */
    async unsubscribeFromAccountEvents(requestParameters: UnsubscribeFromAccountEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.unsubscribeFromAccountEventsRaw(requestParameters, initOverrides);
    }

    /**
     * Unsubscribe from bridge notifications.
     */
    async unsubscribeFromBridgeEventsRaw(requestParameters: UnsubscribeFromBridgeEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters.unsubscribeFromBridgeEventsRequest === null || requestParameters.unsubscribeFromBridgeEventsRequest === undefined) {
            throw new runtime.RequiredError('unsubscribeFromBridgeEventsRequest','Required parameter requestParameters.unsubscribeFromBridgeEventsRequest was null or undefined when calling unsubscribeFromBridgeEvents.');
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/bridge/unsubscribe`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: UnsubscribeFromBridgeEventsRequestToJSON(requestParameters.unsubscribeFromBridgeEventsRequest),
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Unsubscribe from bridge notifications.
     */
    async unsubscribeFromBridgeEvents(requestParameters: UnsubscribeFromBridgeEventsOperationRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.unsubscribeFromBridgeEventsRaw(requestParameters, initOverrides);
    }

}
