/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SubscriptionVerification } from '../models/SubscriptionVerification';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Get authenticated user information
     * @param authorization
     * @returns any Info
     * @throws ApiError
     */
    public static getUserInfo(
        authorization?: string,
    ): CancelablePromise<{
        pub_key?: string;
        version?: string;
        user_id?: number;
        tg_id?: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/user/info',
            headers: {
                'Authorization': authorization,
            },
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Verify Pro subscription status
     * @param authorization
     * @returns SubscriptionVerification Subscription verification successful
     * @throws ApiError
     */
    public static verifySubscription(
        authorization?: string,
    ): CancelablePromise<SubscriptionVerification> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/verify',
            headers: {
                'Authorization': authorization,
            },
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
}
