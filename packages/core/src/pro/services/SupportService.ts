/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SupportService {
    /**
     * Retrieve support link
     * @returns any Returns a link to the support
     * @throws ApiError
     */
    public static getProSupport(): CancelablePromise<{
        url: string;
        is_priority: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/support',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Verifies a support token
     * @param requestBody Data that is expected
     * @returns any Support token status
     * @throws ApiError
     */
    public static verifySupportToken(
        requestBody?: {
            token: string;
        },
    ): CancelablePromise<{
        valid: boolean;
        expires_date: number;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/support/verify',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
}
