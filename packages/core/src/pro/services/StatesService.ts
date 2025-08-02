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
     * @returns State State
     * @throws ApiError
     */
    public static getState(): CancelablePromise<State> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/services/pro/state',
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
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static updateState(
        requestBody?: {
            state: string;
        },
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/services/pro/state',
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
     * @returns Ok Ok
     * @throws ApiError
     */
    public static deleteState(): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/services/pro/state',
            errors: {
                400: `Something went wrong on client side`,
                403: `Access token is missing or invalid`,
                404: `The specified resource was not found`,
                500: `Something went wrong on server side`,
            },
        });
    }
}
