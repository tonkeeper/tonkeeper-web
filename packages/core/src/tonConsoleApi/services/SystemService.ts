/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SystemService {
    /**
     * @returns any Ok
     * @throws ApiError
     */
    public static pingReadyGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/ready',
            errors: {
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * @returns any Ok
     * @throws ApiError
     */
    public static pingReadyHead(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/ready',
            errors: {
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * @returns any Ok
     * @throws ApiError
     */
    public static pingAliveGet(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/alive',
            errors: {
                500: `Something went wrong on server side`,
            },
        });
    }
    /**
     * @returns any Ok
     * @throws ApiError
     */
    public static pingAliveHead(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'HEAD',
            url: '/alive',
            errors: {
                500: `Something went wrong on server side`,
            },
        });
    }
}
