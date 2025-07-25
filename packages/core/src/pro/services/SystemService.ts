/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Ok } from '../models/Ok';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemService {
    /**
     * Check server health status
     * @returns Ok Server is healthy and ready
     * @throws ApiError
     */
    public static healthcheck(): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/healthcheck',
            errors: {
                500: `Something went wrong on server side`,
            },
        });
    }
}
