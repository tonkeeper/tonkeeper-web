/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Ok } from '../models/Ok';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UtilsService {
    /**
     * Send user feedback
     * @param requestBody Data that is expected
     * @returns Ok Ok
     * @throws ApiError
     */
    public static feedback(
        requestBody?: Record<string, string>,
    ): CancelablePromise<Ok> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/feedback',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Something went wrong on client side`,
                500: `Something went wrong on server side`,
            },
        });
    }
}
