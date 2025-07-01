/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TonConnectProof } from '../models/TonConnectProof';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Generate TonConnect authentication payload
     * @returns any The generated payload for TonConnect
     * @throws ApiError
     */
    public static authGeneratePayload(): CancelablePromise<{
        payload: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/auth/proof/payload',
            errors: {
                400: `Something went wrong on client side`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Authenticate user via TonConnect
     * @param requestBody Data that is expected
     * @returns any Ok
     * @throws ApiError
     */
    public static tonConnectAuth(
        requestBody: TonConnectProof,
    ): CancelablePromise<{
        ok: boolean;
        auth_token: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/auth/proof/check',
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
    /**
     * Logout user session
     * @returns any Ok
     * @throws ApiError
     */
    public static logout(): CancelablePromise<{
        ok: boolean;
        auth_token: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/services/pro/logout',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
}
