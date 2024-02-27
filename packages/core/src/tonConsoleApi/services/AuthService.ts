/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Ok } from '../models/Ok';
import type { TgAuth } from '../models/TgAuth';
import type { TonConnectProof } from '../models/TonConnectProof';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthService {
    /**
     * Auth via telegram
     * The token is recorded in the database and in the user's cookies.  If the user logs in under different browsers, then each authorization will have its own token.
     * @param requestBody Data that is expected from Telegram
     * @returns Ok Ok
     * @throws ApiError
     */
    public static authViaTg(
        requestBody?: TgAuth,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/tg',
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
     * Generate payload for TON Connect
     * @returns any Payload for TON Connect
     * @throws ApiError
     */
    public static authGeneratePayload(): CancelablePromise<{
        payload: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/proof/payload',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * Auth via TON Connect
     * The token is recorded in the database and in the user's cookies.  If the user logs in under different browsers, then each authorization will have its own token.
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static authViaTonConnect(
        requestBody?: TonConnectProof,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/proof/check',
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
