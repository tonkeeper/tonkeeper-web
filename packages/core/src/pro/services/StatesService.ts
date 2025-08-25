/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Ok } from '../models/Ok';
import type { State } from '../models/State';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StatesService {
    /**
     * Get user UI state
     * @param authorization
     * @returns State State
     * @throws ApiError
     */
    public static getState(
        authorization: string,
    ): CancelablePromise<State> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/state',
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
     * Update user UI state
     * @param authorization
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static updateState(
        authorization: string,
        requestBody?: {
            state: string;
        },
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/pro/state',
            headers: {
                'Authorization': authorization,
            },
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
     * Delete user UI state
     * @param authorization
     * @returns Ok Ok
     * @throws ApiError
     */
    public static deleteState(
        authorization: string,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/services/pro/state',
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
