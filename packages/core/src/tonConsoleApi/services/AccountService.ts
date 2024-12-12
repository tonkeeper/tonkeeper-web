/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Ok } from '../models/Ok';
import type { Referral } from '../models/Referral';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AccountService {
    /**
     * Get user info
     * @returns any User info
     * @throws ApiError
     */
    public static getUserInfo(): CancelablePromise<{
        user: User;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/me',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Get user referrals
     * @returns any User referrals
     * @throws ApiError
     */
    public static getUserReferrals(): CancelablePromise<{
        items: Array<Referral>;
        total_profit: number;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user/referrals',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Logout from the system
     * After logout, the user's token is deleted
     * @returns Ok Ok
     * @throws ApiError
     */
    public static accountLogout(): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/account/logout',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
}
